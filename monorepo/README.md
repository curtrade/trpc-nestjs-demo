# Монорепо — Auth / Catalog / Cart через tRPC

Учебный проект. Тот же домен, что и в [монолите](../monolith) (корзина, которая
опрашивает аутентификацию и каталог), но разнесённый на **три самостоятельных
сервиса NestJS**, которые общаются между собой по протоколу **tRPC**.

Главная мысль, ради которой всё затевалось:

> Логика остаётся прежней. Меняется только **транспорт**. В монолите Cart
> вызывал `authService.whoami()` и `catalogService.byId()` через DI. Здесь это
> те же по форме вызовы, но они уходят по сети как tRPC-запросы — и тело
> `CartService.add` отличается от монолитного ровно на `async`/`await`.

Ниже — пошаговый разбор, как монолит превратился в эти три сервиса, и собранные
по дороге best practices (включая честный разговор о компромиссах).

---

## TL;DR — запустить за минуту

```bash
pnpm install
pnpm demo        # соберёт, поднимет 3 сервиса и прогонит весь сценарий
```

`pnpm demo` ([`demo-call.sh`](./demo-call.sh)) поднимает все три сервиса,
дожидается их готовности и дёргает публичный REST-вход по всем путям — счастливый
сценарий для двух пользователей плюс все коды ошибок (401/404/409/400), — после
чего всё гасит. Для ручной разработки:

```bash
pnpm dev         # все три сервиса в watch-режиме параллельно
```

---

## Архитектура

```
                       ┌──────────────────────────────┐
  Браузер / curl  ───▶ │  cart-service  :3000  (REST)  │   ← единственный
        (REST)         │  POST /cart/items, GET /cart  │     публичный вход
                       └───────────┬───────────┬───────┘
                                   │ tRPC       │ tRPC
                       ┌───────────▼──┐   ┌─────▼─────────────┐
                       │ auth-service │   │ catalog-service   │
                       │   :3001      │   │   :3002           │
                       │ /trpc        │   │ /trpc             │
                       │ session.     │   │ item.byId         │
                       │   whoami     │   │                   │
                       └──────────────┘   └───────────────────┘
```

Два правила, которые держат всю конструкцию:

- **Публичный край — REST.** Наружу торчит только Cart, и только по REST: его
  удобно звать из браузера, curl, любого HTTP-клиента.
- **Внутренняя сеть — tRPC.** Сервисы между собой общаются по tRPC: типобезопасно
  от вызова до обработчика, без ручного описания DTO и клиентов.

---

## Структура монорепо

[pnpm workspaces](https://pnpm.io/workspaces). Корневой
[`pnpm-workspace.yaml`](./pnpm-workspace.yaml) объявляет `packages/*`.

```
packages/
  shared/           @app/shared          — общий tRPC-инстанс, тип Context, zod-схемы домена
  auth-service/     @app/auth-service     — сессии,  отдаёт session.whoami по tRPC  (:3001)
  catalog-service/  @app/catalog-service  — товары,  отдаёт item.byId по tRPC        (:3002)
  cart-service/     @app/cart-service     — корзина, REST-вход + tRPC-клиенты         (:3000)
```

Зависимости между пакетами объявлены через `workspace:*`, поэтому `pnpm -r build`
собирает их в **топологическом порядке**: сперва `shared`, потом сервисы.

---

## Пошагово: как монолит превратился в три сервиса

### Шаг 0. Общий пакет `@app/shared` — контракт и tRPC-инстанс

Прежде чем что-то разрезать, выносим то, что должно быть **одним на всех**:

- **Единый tRPC-инстанс** ([`shared/src/trpc.ts`](./packages/shared/src/trpc.ts)) —
  `initTRPC.context<Context>().create()`, из него `router` и `publicProcedure`.
  Каждый сервис строит свой роутер из этих же примитивов.
- **Тип контекста** ([`shared/src/context.ts`](./packages/shared/src/context.ts)) —
  пока минимальный (`requestId?`), но это место для пользователя, логгера,
  трейсинга.
- **Доменные схемы на zod** ([`shared/src/domain.ts`](./packages/shared/src/domain.ts)) —
  вход/выход каждой процедуры. **zod — единый источник правды**: из него и
  валидация на рантайме, и TypeScript-типы (`z.infer`). Контракты намеренно
  повторяют монолит один в один:

  ```ts
  whoami:    (token)  →  { userId } | null
  item.byId: (id)     →  Item | null
  ```

### Шаг 1. `auth-service` — тонкий роутер вокруг доменного сервиса

Доменная логика переезжает **как есть**: `AuthService`, `SessionRepository`,
сиды — всё то же, что в монолите, с тем же контрактом `whoami(token) → … | null`
([`auth-service/src/auth/`](./packages/auth-service/src/auth)).

Сверху — тонкий tRPC-роутер. Он не содержит логики, только адаптирует
вход/выход к вызову сервиса
([`auth.router.ts`](./packages/auth-service/src/trpc/auth.router.ts)):

```ts
export function createAuthRouter(auth: AuthService) {
  return router({
    session: router({
      whoami: publicProcedure
        .input(whoamiInput)        // zod-схема из @app/shared
        .output(whoamiOutput)
        .query(({ input }) => auth.whoami(input.token)),
    }),
  });
}
export type AuthRouter = ReturnType<typeof createAuthRouter>;
```

Роутер — это **фабрика**, принимающая сервис. Так бизнес-логика остаётся в
`AuthService` (том же, что звал монолит), а tRPC — лишь обёртка-транспорт. Это же
делает роутер тривиально тестируемым (см. ниже про `createCaller`).

### Шаг 2. `catalog-service` — то же самое зеркало

`catalog-service` — точная копия подхода из шага 1, только домен другой:
`item.byId(id) → Item | null`
([`catalog.router.ts`](./packages/catalog-service/src/trpc/catalog.router.ts)).
Когда второй сервис пишется один в один по первому — это хороший знак: паттерн
устойчив.

### Шаг 3. `cart-service` — потребитель: REST снаружи, tRPC-клиенты внутрь

Cart — единственный с публичным REST-входом и единственный, кто **зовёт** другие
сервисы. Вместо `imports: [AuthModule, CatalogModule]` из монолита здесь —
**tRPC-клиенты**, обёрнутые в обычные провайдеры NestJS
([`clients/auth.client.ts`](./packages/cart-service/src/clients/auth.client.ts)):

```ts
@Injectable()
export class AuthClient {
  private readonly client: CreateTRPCClient<AuthRouter>;

  constructor(config: AppConfiguration) {
    this.client = createTRPCClient<AuthRouter>({
      links: [httpBatchLink({ url: config.authUrl })],
    });
  }

  // Тот же метод, что отдавал монолитный AuthService — только теперь Promise.
  whoami(token: string): Promise<WhoamiResult> {
    return this.client.session.whoami.query({ token });
  }
}
```

Клиент специально называет метод так же — `whoami` / `byId`, — чтобы call-site в
`CartService` совпал с монолитным. Сравните тела `add`:

```ts
// Монолит — синхронно, через DI:
const who  = this.auth.whoami(token);
const item = this.catalog.byId(itemId);

// Монорепо — то же самое, но через сеть:
const who  = await this.auth.whoami(token);
const item = await this.catalog.byId(itemId);
```

Вся остальная логика — nullable-проверки, маппинг в 401/404/409, подсчёт суммы —
**идентична** ([`cart.service.ts`](./packages/cart-service/src/cart/cart.service.ts)).
Публичный REST-контроллер тоже не изменился: `POST /cart/items`, `GET /cart`.

---

## Как именно работает ручная обвязка tRPC + NestJS

Мы **не** используем декораторную библиотеку (вроде `nestjs-trpc`), а связываем
tRPC с Nest руками. Это нагляднее для учебных целей: видно каждый стык.

**На сервере** ([`auth-service/src/main.ts`](./packages/auth-service/src/main.ts)):

```ts
const app = await NestFactory.create<NestExpressApplication>(AppModule);

// 1. Достаём доменный сервис из DI-контейнера Nest.
const authService = app.get(AuthService);

// 2. Строим tRPC-роутер вокруг него.
const appRouter = createAuthRouter(authService);

// 3. Монтируем роутер на нижележащий Express-инстанс как middleware.
app.getHttpAdapter().getInstance()
  .use('/trpc', createExpressMiddleware({ router: appRouter, createContext }));
```

Nest по-прежнему управляет жизненным циклом, DI и конфигом; tRPC живёт сбоку, на
том же Express. Граница чёткая: **Nest владеет процессом, tRPC владеет
эндпоинтом `/trpc`**.

**На клиенте** — `createTRPCClient<Router>` + `httpBatchLink` (см. шаг 3). Тип
роутера прилетает из сервиса, и вызовы получаются полностью типизированными:
`client.session.whoami.query({ token })` знает и аргумент, и тип результата.

**Типобезопасность без рантайм-связи.** Сервис экспортирует **только тип**
роутера ([`auth-service/src/index.ts`](./packages/auth-service/src/index.ts)):

```ts
export type { AuthRouter } from './trpc/auth.router';
```

а потребитель забирает его через `import type`:

```ts
import type { AuthRouter } from '@app/auth-service';
```

`import type` стирается при компиляции — в бандл cart-service **не попадает ни
строчки** кода auth-service. Типы текут на этапе компиляции, рантайм связан
только по HTTP. Если auth-service поменяет контракт — cart-service **перестанет
компилироваться**, и вы узнаете об этом до деплоя, а не в проде.

---

## Best practices (и честно о компромиссах)

**REST снаружи, tRPC внутри.** tRPC прекрасен для типизированной связи
TypeScript↔TypeScript внутри своей системы. Но публичный край лучше держать на
REST: его зовут из браузеров, мобильных, чужих языков. Cart — REST-фасад, за
которым прячется tRPC-сеть.

**Тип-онли шаринг роутеров.** `export type` + `import type` дают сквозную
типобезопасность при нулевой рантайм-связи. Это правильный способ делиться
контрактом внутри монорепо.

**⚠️ Но это связь на этапе сборки, а не «настоящая» распределённость.** Будьте
честны: `@app/shared` и типы роутеров связывают сервисы **в момент компиляции, в
одном репозитории**. Это фича монорепо, а не распределённого деплоя. Если разнести
сервисы по разным репозиториям, `import type '@app/auth-service'` работать
перестанет — тип физически в другом месте. Тогда нужен один из вариантов:

- публиковать типы/роутеры как версионируемый npm-пакет (по сути — тот же общий
  пакет, только через реестр, со всеми хлопотами версионирования);
- генерировать клиент из схемы (codegen) на каждой стороне;
- перейти на транспортно-нейтральный контракт (OpenAPI, gRPC/protobuf) и
  кодоген по нему.

Этот проект сознательно остаётся в рамках монорепо — так нагляднее видно саму
идею tRPC, не утопая в инфраструктуре. Но не выдавайте compile-time-связь
монорепо за слабую связанность микросервисов из разных команд — это разные вещи.

**Nullable-контракт, маппинг в HTTP — только на краю.** Доменные сервисы на
«не найдено» возвращают `null`, а не бросают исключение (`whoami → … | null`,
`byId → Item | null`). В коды HTTP (401/404/409) это превращается **только** в
Cart, на публичном крае. Внутренние сервисы остаются транспортно-нейтральными и
не знают про HTTP-статусы.

**zod — единый источник правды.** Одна схема даёт и рантайм-валидацию входа
(невалидный запрос → `BAD_REQUEST` ещё до обработчика), и статические типы
(`z.infer`). Не нужно держать синхронными отдельные «типы» и «валидаторы».

**Доменная логика не знает про транспорт.** `AuthService`/`CatalogService` —
обычные классы Nest, ничего не знающие про tRPC. Поэтому они тестируются без
сети, а роутер — тонкий и тоже тестируется в изоляции.

**Конфиг — типизированный и валидируемый на старте.** Через
[`@itgorillaz/configify`](https://github.com/itgorillaz/configify): URL соседних
сервисов и порт описаны классом `AppConfiguration`, и кривой конфиг роняет
приложение **на старте**, а не на первом запросе
([cart config](./packages/cart-service/src/config/app.configuration.ts)).

---

## Конфигурация

Каждый сервис читает свой `.env` (см. `*/.env.example`). Значения по умолчанию
рассчитаны на локальный запуск, так что без `.env` всё тоже работает.

| Переменная    | Сервис  | По умолчанию                  | Назначение                       |
| ------------- | ------- | ----------------------------- | -------------------------------- |
| `PORT`        | auth    | `3001`                        | порт tRPC-эндпоинта `/trpc`      |
| `PORT`        | catalog | `3002`                        | порт tRPC-эндпоинта `/trpc`      |
| `PORT`        | cart    | `3000`                        | публичный REST-порт              |
| `AUTH_URL`    | cart    | `http://localhost:3001/trpc`  | адрес auth-сервиса               |
| `CATALOG_URL` | cart    | `http://localhost:3002/trpc`  | адрес catalog-сервиса            |

---

## Тестирование

Две взаимодополняющие проверки:

1. **Юнит-тесты — быстро и офлайн.**
   - Роутеры тестируются через `router.createCaller(ctx)` — без поднятого
     HTTP-сервера, прямой вызов процедуры с zod-валидацией
     ([auth.router.spec](./packages/auth-service/src/trpc/auth.router.spec.ts)).
   - `CartService` тестируется с **фейковыми** tRPC-клиентами: проверяется
     оркестрация и маппинг ошибок (401/404/409), без сети
     ([cart.service.spec](./packages/cart-service/src/cart/cart.service.spec.ts)).
2. **Живая проверка — настоящий транспорт.** `pnpm demo` поднимает все три
   сервиса и гоняет сценарий через реальный tRPC. Юнит-тесты доказывают логику,
   demo — что провода действительно соединены.

```bash
pnpm test        # все пакеты: pnpm -r run test
pnpm lint
pnpm build
```

---

## Монолит vs монорепо — что поменялось

| Аспект                | Монолит                          | Монорепо                                      |
| --------------------- | -------------------------------- | --------------------------------------------- |
| Связь Cart→Auth/Catalog | DI (`imports: [AuthModule…]`)   | tRPC-клиенты (`createTRPCClient`)             |
| Вызовы                | синхронные, в процессе           | `async`/`await`, по сети                      |
| Тип результата        | `Cart`                           | `Promise<Cart>`                               |
| Граница «не найдено»   | `null` → HTTP в Cart            | `null` едет по tRPC, → HTTP в Cart            |
| Деплой                | один процесс                     | три процесса                                  |
| Контракт              | TypeScript-интерфейсы            | zod-схемы в `@app/shared` + типы роутеров     |

Обратите внимание, чего в таблице **нет**: бизнес-логики. Она не изменилась.

---

## Куда расти дальше

Проект намеренно минимален. Очевидные следующие шаги:

- **Постоянное хранилище (Prisma).** Сейчас всё in-memory за репозиториями
  (`SessionRepository`, `ItemRepository`, `CartRepository`). Репозитории уже
  изолируют доступ к данным — замена на Prisma не затрагивает ни роутеры, ни
  Cart.
- **Декораторная интеграция (`nestjs-trpc`).** Мы связывали tRPC с Nest руками —
  это нагляднее. В продакшене библиотека вроде `nestjs-trpc` убирает шаблон
  (роутеры как классы/декораторы, автогенерация), ценой «магии» и ещё одной
  зависимости. Полезно сравнить осознанно.
- **Контекст tRPC по-настоящему.** `Context` пока пустой. Сюда — `requestId` для
  сквозного трейсинга, аутентификация на уровне mesh (служебные токены между
  сервисами), логгер.
- **События вместо синхронного fan-out.** Cart синхронно ждёт Auth и Catalog.
  Для части задач (аналитика, уведомления) уместнее асинхронные события/очередь —
  меньше связанность по времени.
- **Настоящая распределённость.** Разнести сервисы по репозиториям — и придётся
  решать честную задачу совместного контракта (см. раздел про compile-time-связь
  выше): публикация типов, codegen или нейтральный протокол.
