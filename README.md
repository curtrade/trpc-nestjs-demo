# trpc-nestjs-demo

Учебный проект по подключению tRPC к NestJS.
Домен — три сервиса: **Auth**, **Catalog**, **Cart**.

Подробная документация находится в каждом проекте:

| Проект | Папка | Описание |
|---|---|---|
| Монолит | [monolith](./monolith) | Auth / Catalog / Cart как модули одного NestJS-приложения; вызовы между ними — через DI в одном процессе |
| Монорепо | [monorepo](./monorepo) | Auth / Catalog / Cart разбиты на три отдельных NestJS-приложения, общающихся по tRPC |

## Структура

```
trpc-nestjs-demo/
├── monolith/          # Единое NestJS-приложение
├── monorepo/
│   └── packages/
│       ├── auth-service/
│       ├── catalog-service/
│       ├── cart-service/
│       └── shared/    # Общие tRPC-контракты и типы
└── docs/
```

## Запуск

### Монолит

```bash
cd monolith
npm install
npm run start:dev
```

### Монорепо

```bash
cd monorepo
pnpm install
pnpm run dev          # запускает все три сервиса
# или
bash demo-call.sh     # демонстрационные вызовы через tRPC
```
