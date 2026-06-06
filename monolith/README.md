# Монолит — Auth / Catalog / Cart на NestJS

Учебный проект. Это **отправная точка** для демонстрации tRPC: обычное
монолитное приложение NestJS из трёх модулей, которые общаются между собой
через DI. В соседнем проекте этот же монолит разбит на три микросервиса,
которые общаются по протоколу **tRPC** — и это главный предмет изучения.

> [🔗 **Монорепо-версия (микросервисы + tRPC):**](../monorepo)
>
> Там же лежит подробная документация: пошаговый разбор, как монолит
> превращается в три сервиса, и собранные best practices.

## Что внутри

Три модуля и одна сквозная операция «добавить товар в корзину»:

- **Auth** — сессии. `whoami(token) → { userId } | null`.
- **Catalog** — товары. `byId(id) → Item | null`.
- **Cart** — корзина. Публичный REST-вход, который опрашивает Auth и Catalog
  и складывает позицию. Здесь же `null` от соседних сервисов превращается в
  HTTP-коды (401 / 404 / 409).

```
POST /cart/items ──▶ CartService ──DI──▶ AuthService.whoami
                                  └─DI──▶ CatalogService.byId
```

В монорепо-версии эти два вызова через DI становятся вызовами tRPC-клиента по
сети — и больше не меняется почти ничего. В этом и смысл примера.

## Данные (сиды)

Хранилище — in-memory, засеяно детерминированно, чтобы примеры были
воспроизводимы:

| Сессия | Пользователь | Товар | Название      | Цена (коп.) | В наличии |
| ------ | ------------ | ----- | ------------- | ----------- | --------- |
| `s1`   | `u1` (Alice) | `i1`  | Coffee Mug    | 1200        | да        |
| `s2`   | `u2` (Bob)   | `i2`  | T-Shirt       | 2500        | да        |
|        |              | `i3`  | Sticker Pack  | 500         | **нет**   |

## Запуск

```bash
pnpm install
pnpm start:dev        # http://localhost:3000
```

## Проба

```bash
# Alice кладёт 2× Coffee Mug → total 2400
curl -X POST http://localhost:3000/cart/items \
  -H 'x-session-token: s1' -H 'content-type: application/json' \
  -d '{"itemId":"i1","qty":2}'

# её корзина
curl http://localhost:3000/cart -H 'x-session-token: s1'

# ошибки: 401 (нет сессии) / 404 (нет товара) / 409 (нет в наличии, i3)
curl -i -X POST http://localhost:3000/cart/items \
  -H 'x-session-token: s1' -H 'content-type: application/json' \
  -d '{"itemId":"i3","qty":1}'
```

## Команды

```bash
pnpm test        # модульные тесты
pnpm test:e2e    # e2e (REST через корзину)
pnpm lint
pnpm build
```
