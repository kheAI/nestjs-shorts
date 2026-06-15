# NestJS Feels Weird Until It Doesn't
## A field guide to every term that confused you — from first `@Module` to multi-tenant God Mode

You open a NestJS project for the first time and something feels off.

Not bad — just... *architectural*. There are decorators on everything. Classes that don't seem to do anything except hold other classes. A folder called `dto`. A file called `user.module.ts` that contains only a handful of imports and nothing that looks like actual code.

Where's the logic? Where does the app actually *start*?

If you came from Express, you're used to wiring things manually — `app.use()`, `app.get()`, everything visible in one file. If you came from Meteor, you're used to magic — data syncs itself, auth manages itself, the framework makes decisions you never see.

NestJS is neither. It makes *you* make every decision, but it gives you a vocabulary to make those decisions consistently. The problem is that vocabulary has about 30 words and the documentation defines them all in terms of each other.

This guide breaks that loop. Every term, explained from scratch, with an analogy from the real world and a code example that actually does something. No prior NestJS knowledge assumed. No glossing over the parts that are genuinely confusing.

Work through it top-to-bottom once. Then keep it as a reference. By the end, the "weird" feeling will have a different name: *architecture*.



## Part 1 — The Vocabulary You See on Day One

> Five terms. Every file in every NestJS project uses at least three of them. Learn these first or nothing else makes sense.

### Module — "the department"

Here's the first thing that trips people up: a NestJS application is not a flat list of files. It's a **tree of modules**, and every module is a box that declares what it owns, what it borrows, and what it lends.

Think of each module as a **department in a company**. The HR Department owns its own staff, tools, and filing cabinets. It doesn't walk directly into Finance to grab payroll data — it formally requests it through a defined interface. Finance decides whether to share. Nobody reaches into anyone else's drawer.

In code, that looks like this:

```typescript
// apps/api/src/modules/user/user.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],  // borrow the DB connection
  controllers: [UserController],                       // own these HTTP handlers
  providers:   [UserService, UserRepository],          // own these classes
  exports:     [UserService],                          // lend UserService to others
})
export class UserModule {}
```

The four keys of `@Module()` map directly to the department analogy:

- `imports` — what this department needs from others
- `controllers` — the department's front-desk staff (HTTP handlers)
- `providers` — the department's internal workers (services, repositories)
- `exports` — what the department is willing to share with other departments

One rule to commit to memory right now: **one feature, one module**. `TodoModule`, `UserModule`, `AuthModule`. Never one giant `AppModule` doing everything.



### Controller — "the receptionist"

A Controller is the entry point for HTTP requests. `@Get()`, `@Post()`, `@Delete()` — route definitions live here. The class is decorated with `@Controller('path')` to set the base URL.

Here is the most important thing to understand about controllers: **they contain zero business logic.**

Not "very little." Zero. No `if` statements about data. No database calls. No validation beyond what a pipe handles automatically. A controller method has exactly one job: take the request, hand it to a service, and return the result.

The analogy that makes this click: the controller is the **receptionist at a doctor's clinic**. She takes your name and reason for visit. She decides which doctor to route you to. She hands you the doctor's answer when your appointment ends. She does not examine you. She does not prescribe treatment. She routes and returns.

```typescript
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);  // two lines: receive, delegate
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);  // same pattern
  }
}
```

If your controller method body is longer than two lines, stop. You're doing the doctor's job at the front desk.



### Service — "the doctor"

Services are where the actual work happens. The controller routes to here. The service examines the request (validates business rules), does the meaningful computation, calls the repository if data is needed, and returns the result.

Services are the only layer that knows about business rules. They are `@Injectable()` — we'll explain what that means in a moment — and they live in `*.service.ts` files.

The receptionist sends you to the **doctor**. The doctor examines you. The doctor prescribes treatment. The doctor does not answer phones or handle paperwork. She does medicine.

```typescript
@Injectable()
export class UserService {
  constructor(private readonly userRepo: UserRepository) {}

  async create(dto: CreateUserDto) {
    const existing = await this.userRepo.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');
    return this.userRepo.save(this.userRepo.create(dto));
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOneBy({ id });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }
}
```

One litmus test: if a service method imports anything from `@nestjs/common` that relates to HTTP (request objects, response objects, status codes), it's probably in the wrong layer.



### Provider — "anything the power grid can power"

Provider is the umbrella term for anything the NestJS dependency injection system manages. Services are providers. Repositories are providers. Email clients, Stripe wrappers, custom utilities — all providers. The `@Injectable()` decorator is the "plug" that says "I want to be managed by the system."

The analogy: providers are **appliances plugged into the power grid**. The grid (the DI container) supplies electricity. Any appliance with a plug (`@Injectable()`) can draw power. You don't wire them manually — you declare "this appliance exists" in your module's `providers` array, and the grid handles the rest.

```typescript
@Injectable() export class UserService {}      // a service — also a provider
@Injectable() export class EmailService {}     // a wrapper — also a provider
@Injectable() export class TenantContext {}    // a utility — also a provider
```

Registering a class in a module's `providers` array is what tells the grid to manage it. `@Injectable()` alone isn't enough — the grid has to know it exists.



### Decorator — "the sticky label"

Decorators are the `@` things on everything. They're a TypeScript feature that attaches metadata to a class, method, property, or parameter. NestJS reads those metadata labels at startup and wires the application accordingly.

Think of them as **sticky labels on a file folder**. The folder content doesn't change — the label tells whoever handles it what to do: "URGENT", "CONFIDENTIAL", "ADMIN ONLY". NestJS is the handler reading those labels.

```typescript
@Controller('tasks')         // label: "this class handles /tasks routes"
@UseGuards(AuthGuard)        // label: "run AuthGuard before any method"
export class TaskController {

  @Get(':id')                // label: "this method handles GET /tasks/:id"
  @Roles('admin')            // label: "caller must have the admin role"
  findOne(
    @Param('id') id: string, // label: "inject the :id route param here"
    @CurrentUser() user: User // label: "inject the authenticated user here"
  ) {
    return this.taskService.findOne(id);
  }
}
```

You can create custom decorators too — `@CurrentUser()` above is one. We'll get to that.



### Bootstrapping / main.ts — "opening day"

Every NestJS application has a `main.ts`. It calls `NestFactory.create(AppModule)`, which builds the entire dependency injection container from the module tree. Then it applies global configuration — `ValidationPipe`, CORS, the listening port — and starts accepting requests.

This is the **building manager on opening day**. Before any tenant (module) can operate, the manager unlocks the doors, turns on the power, verifies permits, and opens reception. Once that's done, business can start.

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // strip fields not declared in the DTO
    forbidNonWhitelisted: true,   // reject requests with unknown fields
    transform: true,              // auto-cast "42" → 42 etc.
  }));

  app.enableCors({ origin: process.env.FRONTEND_URL });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

`ValidationPipe` here is doing a lot of work. Understanding it properly requires understanding DTOs first.



## Part 2 — Making Requests Safe

> Your API exists now. But it trusts everything. This section is about the machinery that sits between an incoming request and your handler — the layers that validate, protect, observe, and catch.

### DTO — "the customs declaration form"

DTO stands for Data Transfer Object. It's a plain TypeScript class that defines the exact shape of data allowed to cross your API boundary.

On its own, a DTO is just a class. Combined with `class-validator` decorators and the global `ValidationPipe`, it becomes an automatic contract enforcer. Every incoming request body is compared against the DTO. If the data doesn't match the declared shape — wrong type, missing required field, unexpected field — the request is rejected with a 400 before it ever touches your service.

The analogy is a **customs declaration form at an airport border**. Before anything enters the country (your service), it must declare its exact contents. The customs officer (ValidationPipe) checks the form. Undeclared items? Confiscated (`whitelist: true`). Unknown items? Detained (`forbidNonWhitelisted: true`). Malformed form? Turned back at the border.

```typescript
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(0)
  age: number;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

Two rules you must never break:

**Never accept `id`, `tenantId`, or `userId` as client-provided DTO fields.** These are server-assigned values. Accepting them from the client is a security vulnerability — the client could claim to be any user, any tenant, any record.

**Never accept `createdAt` or `updatedAt`.** Those come from the database.



### Pipe — "the water filter"

A Pipe operates on the arguments flowing into a route handler, either to **transform** them (string → number) or **validate** them (reject if not a UUID). Pipes run after guards but before your controller method executes.

The built-in pipes cover the common cases: `ValidationPipe` (validates DTOs), `ParseIntPipe` (string → integer, 400 if it fails), `ParseUUIDPipe` (validates UUID format), and several others.

The analogy: a pipe is a **water purification system**. Raw tap water (incoming request data) flows through the filter. Impurities (invalid fields, wrong types) are removed. Only clean, certified water reaches your handler.

```typescript
@Get(':id')
findOne(@Param('id', ParseUUIDPipe) id: string) {
  // id is guaranteed to be a valid UUID before this line runs
  return this.userService.findOne(id);
}
```

You can also write custom pipes for domain-specific transformations — trimming strings, normalising phone numbers, coercing enum values.



### Guard — "the bouncer"

A Guard is a class implementing `CanActivate`. It runs before a route handler and returns `true` (allow) or throws (deny). This is the correct place for authentication ("is this request from a verified user?") and authorisation ("is this verified user allowed to do this specific thing?").

Guards can be chained — if you apply two guards, both must pass. They run in the order they're declared.

The analogy: a guard is a **nightclub bouncer**. Before you reach the dance floor, the bouncer checks: Do you have a wristband? Is your wristband for the VIP section? Are you on the banned list? He doesn't negotiate. It's yes or no. A separate bouncer handles each check — you don't have one bouncer who does everything.

```typescript
@Injectable()
export class AuthJwtGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    if (err || !user) throw new UnauthorizedException('Invalid or expired token');
    return user;
  }
}

// Apply to a single route, a whole controller, or globally
@UseGuards(AuthJwtGuard, RolesGuard)  // both must pass, in order
@Mutation(() => UserDto)
createUser(@Args('input') input: CreateUserInput) { /* ... */ }

// Or register globally so every route requires auth by default:
{ provide: APP_GUARD, useClass: AuthJwtGuard }
```



### Interceptor — "the sandwich"

An Interceptor can run code **before and after** a handler executes. It wraps the handler using RxJS Observables. The `next.handle()` call is the actual handler. Code before it runs pre-handler. Code in `.pipe()` runs post-handler. The response only exists once both layers have completed.

Use cases: logging execution time, caching responses, transforming response shape, adding correlation headers.

The analogy is a **sandwich**. Top bread = code before the handler (start the timer, check the cache). Filling = handler execution. Bottom bread = code after (stop the timer, transform the result). A sandwich is only complete when both slices are in place.

```typescript
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    return next.handle().pipe(
      tap(() => console.log(`Request completed in ${Date.now() - start}ms`))
    );
  }
}
```



### Middleware — "the airport scanner"

Middleware runs *before* the guard/pipe/interceptor pipeline. It has direct access to raw `Request` and `Response` objects. It's the right layer for things that don't need NestJS context: correlation IDs, security headers, rate limiting, request logging.

The key difference from an interceptor: middleware is Express-level — it sees the raw `req`/`res` before NestJS has done any processing. Interceptors are NestJS-level — they see the typed handler and operate on the Observable stream.

The analogy: middleware is the **airport body scanner before check-in**. You haven't shown your boarding pass yet (that's the guard). The scanner just makes sure nothing obviously dangerous enters the building before the more specific checks begin.

```typescript
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    req['correlationId'] = req.headers['x-correlation-id'] ?? randomUUID();
    res.setHeader('x-correlation-id', req['correlationId']);
    next();  // always call next() or the request hangs forever
  }
}
```



### Exception Filter — "the customer service desk"

When something goes wrong in your application — a service throws a `NotFoundException`, a database call fails, a DTO doesn't validate — an Exception Filter catches it and converts it into a structured HTTP response. Without a custom filter, NestJS uses its built-in handler which returns reasonable but generic error shapes.

Custom filters let you control exactly what your API's error responses look like. You can add correlation IDs, timestamps, error codes, links to documentation.

The analogy: the exception filter is the **customer service desk**. Something went wrong on the shop floor (an error was thrown). Instead of the customer witnessing an internal meltdown, the customer service desk catches the situation, puts it in a calm professional envelope, and hands back a clear response: "We couldn't find that item — here's your reference number."

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const status = exception.getStatus();

    ctx.getResponse().status(status).json({
      statusCode: status,
      message:    exception.message,
      path:       ctx.getRequest().url,
      timestamp:  new Date().toISOString(),
      correlationId: ctx.getRequest()['correlationId'],
    });
  }
}
```



## Part 3 — How the Architecture Holds Together

> You know what each piece is. Now let's talk about why they're connected the way they are — the ideas that make NestJS feel logical instead of ceremonial.

### Dependency Injection — "the staffing agency"

Dependency Injection (DI) is the mechanism that makes the entire system work. Here's the idea: instead of a class creating its own dependencies (`const emailService = new EmailService()`), it declares what it needs in its constructor and the **DI container** provides those instances automatically.

You never call `new MyService()`. You declare "I need a `UserRepository` and an `EmailService`." NestJS creates them (or reuses existing singletons), and hands them to your class when it's constructed.

Why does this matter? **Testability**. In tests, you can swap the real `EmailService` for a mock — without changing a single line of production code. You just tell the container "use this fake instead." The class under test never knows the difference.

The analogy: DI is a **professional staffing agency**. A chef (your class) declares to the agency: "I need a sous chef, a pastry specialist, and a sommelier." On opening day, the agency sends the right people. The chef focuses entirely on cooking. In the test kitchen, the agency sends stand-ins. The chef cooks the same way regardless.

```typescript
// Without DI — tightly coupled, untestable
class OrderService {
  private emailService = new EmailService(); // hardwired — can't mock
  private userRepo = new UserRepository();   // hardwired — needs a real DB
}

// With DI — decoupled, mockable
@Injectable()
class OrderService {
  constructor(
    private readonly emailService: EmailService,  // agency delivers this
    private readonly userRepo: UserRepository,     // agency delivers this
  ) {}
}

// In tests — swap the real implementations for fakes:
const moduleRef = await Test.createTestingModule({
  providers: [
    OrderService,
    { provide: EmailService, useValue: { send: jest.fn() } },
    { provide: UserRepository, useValue: mockUserRepo },
  ],
}).compile();
```



### Scope — "how the coffee gets made"

Scope controls how long a provider instance lives.

- `DEFAULT` (singleton): one instance created once, shared by everyone for the life of the app
- `REQUEST`: a fresh instance created per incoming HTTP request — destroyed when the request ends
- `TRANSIENT`: a new instance every single time it is injected into something

Most things should be singletons. Reserve `REQUEST` scope for things that genuinely carry per-request identity — the canonical example is `TenantContext`, a service that holds the current user's tenant ID for the duration of one request.

The scopes as **coffee service styles**:
- `DEFAULT` = one communal coffee maker in the kitchen, shared by the whole office
- `REQUEST` = a fresh cup brewed per visitor as they arrive
- `TRANSIENT` = a new cup materialises every time anyone reaches for one, even mid-sentence

Important: a `REQUEST`-scoped provider makes every class that depends on it `REQUEST`-scoped too. This cascades up the dependency tree and has a real performance cost. Use it deliberately.

```typescript
@Injectable({ scope: Scope.DEFAULT })   // singleton — for stateless services
export class CacheService {}

@Injectable({ scope: Scope.REQUEST })   // new instance per request — for stateful context
export class TenantContext {
  tenantId: number;
}
```



### Repository Pattern — "the librarian"

The Repository is the only layer in your application that is allowed to talk to the database. Services don't write TypeORM queries. Services don't call `this.repo.find()` directly. They ask the Repository, which translates the request into a database operation and returns typed results.

This separation is what makes services testable without a real database. In tests, you mock the repository — return a fake user, simulate a "not found" case — and test the service logic in isolation.

The analogy: the repository is a **librarian**. You (the service) say "I need the book by Author Smith published after 2020." You don't go into the stacks yourself. You don't know how the filing system works. The librarian fetches it and hands it to you. You don't care if it came from shelf 3 or the archive.

```typescript
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { email } });
  }

  findActiveByTenantId(tenantId: number): Promise<UserEntity[]> {
    return this.repo.find({ where: { tenantId, isActive: true } });
  }

  save(entity: Partial<UserEntity>): Promise<UserEntity> {
    return this.repo.save(entity);
  }
}
```



### Entity — "the government form template"

A TypeORM Entity is a TypeScript class decorated with `@Entity()` where each property maps to a column in the database. It's the database schema and the TypeScript type in one place. TypeORM reads these classes to generate migrations, build queries, and infer types.

The analogy: an entity is a **government form template**. The template defines every field — name, type, whether it's required, the maximum length. Every filled-in form (database row) must match the template exactly. When the government revises the form (migration), all future submissions follow the new version.

```typescript
@Entity('user')
export class UserEntity extends AbstractEntity {
  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => TenantEntity, { onDelete: 'RESTRICT' })
  tenant: TenantEntity;

  @RelationId((user: UserEntity) => user.tenant)
  @Index()
  @Column()
  tenantId: number;
}
```

One rule that saves careers: **never use `synchronize: true` in production**. It auto-alters your live database to match your entities without a migration review. It can silently drop columns. Use migrations instead.



### TypeORM Migration — "git commits for your database"

A Migration is a TypeScript file with two methods: `up()` (apply the change) and `down()` (revert it). Migrations run in timestamp order and are tracked in a `migrations` table in your database. Every schema change is a migration. You never alter a past migration — you add a new one.

The analogy says it all: migrations are **git commits for your database schema**. Every commit adds a reversible change. You can see the full history. You can roll back to any point. You never rewrite a past commit in production — you write a new one that undoes the problem.

```typescript
export class AddUserRoleColumn1717000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" ADD "role" varchar NOT NULL DEFAULT 'member'
    `);
    await queryRunner.query(`CREATE INDEX "IDX_user_role" ON "user" ("role")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_role"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "role"`);
  }
}
```

Dangerous migrations — adding a `NOT NULL` column without a default, renaming a column, dropping a column — require special handling. Always test against a production-size data clone on staging before running in prod.



### ConfigModule / ConfigService — "the company handbook"

`ConfigModule` loads your `.env` file and makes values available app-wide via `ConfigService`. The crucial part is the validation schema (Joi or Zod): if a required environment variable is missing, the application **refuses to start**. It throws at startup, loudly, rather than silently failing when the missing value is first accessed at 2am in production.

The analogy: `ConfigService` is the **official company policy handbook in a locked cabinet**. Instead of each employee keeping private sticky notes with company rules (hardcoded values scattered across files), there's one handbook. Any employee (service) requests a policy by name. And before the company opens each morning, the manager checks the handbook is complete — a missing page keeps the office closed until it's fixed.

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    DATABASE_URL:     Joi.string().required(),
    JWT_PRIVATE_KEY:  Joi.string().required(),
    JWT_PUBLIC_KEY:   Joi.string().required(),
    REDIS_URL:        Joi.string().required(),
    PORT:             Joi.number().default(3000),
  }),
});

// In any service:
this.config.getOrThrow<string>('JWT_PRIVATE_KEY');
// getOrThrow — throws at runtime if missing (belt + suspenders after startup validation)
```



## Part 4 — Building Systems That Scale

> The architecture from Part 1–3 works for a single-developer project. The patterns in this section are why teams of ten can work on the same codebase without stepping on each other — and why the system keeps working under load.

### CQRS — "two kitchens that never share a stove"

CQRS stands for Command Query Responsibility Segregation. The idea is simple and feels obvious once you've been burned by the alternative:

**Commands** change state. Create, update, delete. They return nothing or a minimal acknowledgement. They are named as verb phrases: `CreateUserCommand`, `DeleteTodoCommand`.

**Queries** read state. Fetch, list, search. They never mutate anything. They are named as noun phrases: `FindUserByIdQuery`, `ListTodosQuery`.

Each command or query has exactly one **Handler** — a class that does the work. A `CommandBus` or `QueryBus` routes the message to the right handler.

Why bother? Because reads and writes have fundamentally different requirements. Reads need to be fast and composable. Writes need to enforce business rules and trigger side effects. Mixing them in one "service method that does everything" creates God classes that are impossible to test or reason about. The bigger the codebase, the worse it gets.

The analogy: CQRS is a **restaurant with two completely separate kitchens**. The order kitchen (Commands) accepts new orders, cooks food, and changes the state of the menu. The reading kitchen (Queries) only describes what's available and delivers already-plated dishes — it never starts the oven. A waiter from the reading kitchen cannot place new orders. There is zero confusion about which kitchen does what.

```typescript
// The Command — a plain class, the "message"
export class CreateUserCommand {
  constructor(
    public readonly dto: CreateUserDto,
    public readonly tenantId: number,
  ) {}
}

// The Handler — one class, one job
@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler
  implements ICommandHandler<CreateUserCommand> {

  constructor(private readonly userService: UserService) {}

  execute({ dto, tenantId }: CreateUserCommand) {
    return this.userService.createOne({ ...dto, tenantId });
  }
  // Three lines. Handler is thin — logic is in the service.
}

// Dispatching from a resolver:
await this.commandBus.execute(new CreateUserCommand(dto, tenantContext.tenantId));
```

The Golden Rule: **handlers must be thin**. A handler is a one-liner that calls the service. A handler longer than three lines is doing the service's job.



### CommandBus / QueryBus — "the postal sorting facility"

The `CommandBus` and `QueryBus` are the in-process message brokers that connect callers (resolvers, controllers) to handlers. You dispatch a command or query object. The bus finds the registered handler. The handler executes. You get the result. The caller never imports the handler directly.

This decoupling is the whole point. A resolver dispatching a command doesn't know or care which class handles it. The handler can be replaced, wrapped in a transaction, or decorated with logging without touching the resolver.

The analogy: the bus is a **national postal sorting facility**. You write a letter (command object), drop it in the slot, and the facility reads the address (the class name), routes it to the right delivery driver (handler), and delivers it. You don't drive to the destination yourself. You don't know which driver was used. You just know it arrived.

```typescript
// In a resolver:
@Mutation(() => UserDto)
createUser(@Args('input') input: CreateUserInput) {
  return this.commandBus.execute(new CreateUserCommand(input));
}

@Query(() => UserDto)
user(@Args('id') id: string) {
  return this.queryBus.execute(new FindUserByIdQuery(id));
}
```



### EventBus / Domain Events — "the office PA announcement"

After a command handler completes successfully, it can publish a **Domain Event** via the `EventBus`. Multiple unrelated handlers can listen for the same event — one sends a welcome email, another updates an audit log, another provisions a third-party account. The command handler doesn't know or care who reacts. It just announces that something happened.

Domain events are named in the past tense: `UserCreatedEvent`, `TodoDeletedEvent`. They represent facts.

The analogy: a domain event is a **public announcement over the office PA**: "New employee Alex just joined!" HR hears it and adds Alex to payroll. IT hears it and provisions a laptop. The manager hears it and books an induction. The PA system broadcasts the fact. Each listener reacts independently, asynchronously, without the PA operator managing any of it.

```typescript
// Publish from the command handler after success
async execute({ dto, tenantId }: CreateUserCommand) {
  const user = await this.userService.createOne({ ...dto, tenantId });
  this.eventBus.publish(new UserCreatedEvent(user.id, user.email, tenantId));
  return user;
}

// A completely separate class listens and reacts
@EventsHandler(UserCreatedEvent)
export class SendWelcomeEmailHandler implements IEventHandler<UserCreatedEvent> {
  async handle({ email }: UserCreatedEvent) {
    await this.emailService.sendWelcome(email);
  }
}
```



### Resolver (GraphQL) — "the personal shopper"

In a NestJS GraphQL application, a Resolver serves the same role as a Controller in REST — but for GraphQL operations. `@Query()` for reads, `@Mutation()` for writes, `@Subscription()` for real-time pushes. The GraphQL schema is automatically generated from your TypeScript type annotations — you never write `.graphql` SDL files manually.

If a REST controller is a **traffic cop on a street** (five fixed intersections, all cars must choose one), a GraphQL resolver is a **personal shopper at a department store**. The client tells the shopper exactly what it wants: "Give me the product name, its category name, and the most recent three reviews — nothing else." The shopper fetches that precise shape in one trip. No over-fetching. No under-fetching. No "I need to make three separate API calls to assemble the data I want."

```typescript
@Resolver(() => UserDto)
export class UserResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Query(() => UserDto, { nullable: true })
  @UseGuards(AuthJwtGuard)
  user(@Args('id', { type: () => Int }) id: number) {
    return this.queryBus.execute(new FindOneUserQuery({ filter: { id: { eq: id } } }));
  }

  @Mutation(() => UserDto)
  @UseGuards(AuthJwtGuard)
  createUser(
    @Args('input') input: CreateUserInput,
    @CurrentUser() currentUser: RequestUser,
  ) {
    return this.commandBus.execute(new CreateOneUserCommand({ input }));
  }
}
```



### Passport Strategy — "lanes at the border crossing"

Passport.js is the industry-standard Node.js authentication library. A **Strategy** defines *how* to authenticate one specific mechanism. The JWT strategy checks the `Authorization: Bearer <token>` header. The Local strategy checks username and password in the request body. OAuth strategies delegate to Google, GitHub, or any provider.

Each strategy is a provider with a unique string name (`'jwt'`, `'local'`, `'portal-jwt'`). Guards call strategies by name. You can have multiple strategies in one application — one for your users, a separate one for your admin portal.

The analogy: strategies are **different ID verification lanes at the same border crossing**. Lane 1 checks passports (JWT strategy). Lane 2 checks work permits (API key strategy). Lane 3 uses biometrics (OAuth). The border agent (guard) picks the lane based on the traveller's situation. A passport doesn't get you through the work permit lane.

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:    config.getOrThrow('JWT_PUBLIC_KEY'),
      algorithms:    ['RS256'],
    });
  }

  // Only runs if the JWT signature is cryptographically valid
  async validate(payload: JwtPayload): Promise<RequestUser> {
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException();
    return { ...user, tenantId: payload.tenantId };
    // This becomes req.user — accessible via @CurrentUser()
  }
}
```



### JWT — HS256 vs RS256 — "master key vs wax seal"

This distinction matters enormously in a multi-service architecture and almost no one explains it clearly.

Both HS256 and RS256 sign JWTs cryptographically. The difference is *who can sign* vs *who can verify*.

**HS256** uses one shared secret. Anyone who has the secret can both sign new tokens *and* verify existing ones. In a multi-service system, every service needs the secret. A compromised service can now forge tokens on behalf of any user. One breach, full system compromise.

**RS256** uses an asymmetric key pair. The **private key** (which only the auth service ever holds) signs new tokens. The **public key** (which any service can have) verifies them. A compromised downstream service can verify tokens — but it cannot forge new ones because it never had the private key.

| | HS256 | RS256 |
|---|---|---|
| Keys | One shared secret | Private key (sign) + Public key (verify) |
| Who can sign? | Anyone with the secret | Only the auth service |
| Who can verify? | Anyone with the secret | Anyone with the public key |
| Compromise impact | One breach → forge any token | Downstream breach → cannot forge |
| Correct choice for microservices | No | Yes |

The analogy: HS256 is a **master key** — whoever has it can both lock and unlock. RS256 is a **royal wax seal**: only the king has the signet ring (private key) that makes the seal. Anyone can inspect a seal to verify it's genuine (public key). But they cannot produce a convincing forgery — the ring never leaves the king's possession.

```typescript
// Signing — only the auth service does this (holds the private key)
const token = this.jwtService.sign(
  { sub: user.id, tenantId: user.tenantId, roles: user.roles },
  { algorithm: 'RS256', privateKey: this.config.getOrThrow('JWT_PRIVATE_KEY'), expiresIn: '15m' }
);

// Verifying — any service can do this (only needs the public key)
// Handled automatically by JwtStrategy when configured with publicKey
```



### DataLoader & the N+1 Problem — "the warehouse trip problem"

The N+1 problem is one of the most common silent performance killers in GraphQL APIs. Here's how it happens:

You query 100 posts. Each post has an `author` field. Your resolver fetches the author for each post. That's 100 individual `SELECT * FROM users WHERE id = ?` queries — one per post. Plus the original query. 101 total. On a busy API, this is catastrophic.

**DataLoader** solves it by batching: it collects all the user-ID lookups from one request cycle, fires a single `SELECT * FROM users WHERE id IN (...)` with all IDs, and distributes results back to each post resolver. 100 posts, 1 user query. Total: 2.

DataLoaders must be `REQUEST`-scoped — a fresh batch per HTTP request, never shared across requests.

The analogy: imagine a café where every customer causes the barista to run to the warehouse for coffee beans — **per cup**. 100 customers = 100 warehouse trips. DataLoader is the barista who waits until the morning rush settles, writes down all 100 orders, makes **one warehouse trip** with the complete list, and fills all cups. 100 customers, 1 trip.

```typescript
@Injectable({ scope: Scope.REQUEST })  // must be REQUEST scope — fresh per request
export class UserDataLoader {
  constructor(private readonly userRepo: UserRepository) {}

  readonly loader = new DataLoader<number, UserEntity>(
    async (ids: readonly number[]) => {
      const users = await this.userRepo.findByIds([...ids]);
      return ids.map(id => users.find(u => u.id === id) ?? null);
      // DataLoader requires results in the EXACT SAME ORDER as input ids
    }
  );
}

// In a resolver field — called 100 times, fires 1 query
@ResolveField(() => UserDto, { nullable: true })
author(@Parent() todo: TodoDto, @Context() ctx: GqlContext) {
  return todo.userId ? ctx.loaders.user.loader.load(todo.userId) : null;
}
```



### Bull Queue — "the kitchen ticket rail"

Bull is a Redis-backed job queue. The pattern: instead of doing heavy work synchronously (blocking the web process, risking an HTTP timeout), you push a **job** into the queue and return a response immediately. A separate **worker** process picks up jobs and processes them asynchronously.

Use it for: sending emails, processing uploaded images, running AI inference, generating PDFs, anything that could take more than a second.

The analogy: Bull is the **ticket rail in a restaurant kitchen**. The waiter (web process) takes your order, clips the ticket, and immediately returns to serve the next table. The chef (worker) processes tickets at their own pace. The waiter never stands next to the stove watching your steak cook — that would block the entire front of house.

```typescript
// Web process: enqueue the job and return immediately
await this.notificationQueue.add(
  'welcome-email',
  { userId, email },
  { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
);

// Worker process: processes jobs in the background
@Processor('notifications')
export class NotificationProcessor {
  @Process('welcome-email')
  async handle(job: Job<{ userId: number; email: string }>) {
    await this.emailService.sendWelcome(job.data.email);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    // log, alert, dead-letter queue — your choice
  }
}
```



### Redis PubSub & GraphQL Subscriptions — "the broadcast tower"

GraphQL Subscriptions push live data to connected clients over WebSockets. On a single server, an in-memory `PubSub` works. In production with multiple server instances behind a load balancer, it breaks: Server A publishes an event, but clients connected to Server B and C never receive it — they're on a different in-memory bus.

Redis PubSub fixes this. Server A publishes to a Redis channel. Redis fans the message out to every subscribed server instance. Each instance forwards it to its WebSocket clients. All clients receive it regardless of which server they're connected to.

The analogy: in-memory PubSub is a **walkie-talkie** — only people in direct radio range receive the message. Redis PubSub is a **broadcast radio tower** — one station transmits, every radio in the country picks up the same signal simultaneously.

```typescript
@Subscription(() => TodoDto, {
  filter: (payload, _vars, ctx) =>
    payload.todoUpdated.tenantId === ctx.req.user.tenantId,
})
todoUpdated() {
  return this.pubSub.asyncIterator('TODO_UPDATED');
}

// Publishing from any service on any server instance:
await this.pubSub.publish('TODO_UPDATED', { todoUpdated: todo });
```



## Part 5 — God Mode: Enterprise Patterns

> This is the section you read when you're building a real product that handles real tenants, real roles, and real money. Every pattern here exists to prevent a specific class of production failure.

### Multi-tenancy — "the storage unit facility"

A multi-tenant system serves multiple independent organisations (tenants) from a single running application and a single database. Tenant A and Tenant B share code, servers, and tables. Their data is completely invisible to each other.

There are three strategies:

| Strategy | How | Best for |
|---|---|---|
| Separate databases | Each tenant gets its own DB instance | Regulatory compliance; very large enterprise clients |
| Separate schemas | Same DB; each tenant has a PostgreSQL schema | Medium tenants; moderate compliance requirements |
| Shared tables + `tenantId` | Single tables; every row carries a `tenantId` column | Most B2B SaaS — simplest and most cost-efficient |

Enterprise NestJS uses **shared tables + `tenantId`**. It's the simplest approach that works for the vast majority of B2B products and the one every pattern in this section is built around.

The analogy: multi-tenancy is a **cloud storage unit facility** with hundreds of units. All units share the same building, the same staff, the same lock type. Each tenant can only access their own unit. If a staff member accidentally opens Unit 102's door for the Unit 101 tenant, that is a catastrophic data breach. Every operation — open, read, modify, delete — must check the unit number first. Every time. Without exception.



### tenantId Pattern — "the unit number on everything"

Every domain entity that belongs to a tenant carries a `tenantId` foreign key. `tenantId` comes **only** from the JWT — extracted from the authenticated user's verified token, never accepted from the client as a request field.

Three rules that are non-negotiable:

1. `tenantId` is **never** a `@Field()` on any `@InputType()` — clients cannot provide it
2. `tenantId` is **never** a `@FilterableField()` on the DTO — clients cannot filter by it
3. `tenantId` is **always** sourced from `this.tenantContext.tenantId` inside the handler — never from anywhere the client controls

```typescript
@Entity('todo')
export class TodoEntity extends AbstractEntity {
  @Column()
  title: string;

  // Tenant FK — on every domain entity
  @ManyToOne(() => TenantEntity, { onDelete: 'RESTRICT' })
  tenant: TenantEntity;

  @RelationId((todo: TodoEntity) => todo.tenant)
  @Index()      // every WHERE tenantId = ? benefits from this index
  @Column()
  tenantId: number;

  // Owner FK — who created this specific record
  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  user: UserEntity | null;

  @RelationId((todo: TodoEntity) => todo.user)
  @Index()
  @Column({ nullable: true })
  userId: number | null;
}
```



### TenantGuard & TenantContext — "the automatic unit key"

`TenantGuard` runs globally after `AuthJwtGuard`. Its job is simple: read `tenantId` from the already-verified JWT payload (`req.user.tenantId`) and store it in a `REQUEST`-scoped `TenantContext` service. Every handler, service, and authorizer in the request chain can then inject `TenantContext` to get `tenantId` without threading it through every function signature.

The `REQUEST` scope is critical — each HTTP request gets its own `TenantContext` instance. If it were a singleton, requests from different tenants would overwrite each other's `tenantId`.

```typescript
@Injectable({ scope: Scope.REQUEST })  // one instance per request — mandatory
export class TenantContext {
  tenantId: number;
}

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContext) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = GqlExecutionContext.create(context).getContext().req;
    if (user?.tenantId) this.tenantContext.tenantId = user.tenantId;
    return true;  // doesn't reject — just extracts and stores
  }
}

// Register globally, in order, in AppModule:
{ provide: APP_GUARD, useClass: AuthJwtGuard },   // 1. verify JWT
{ provide: APP_GUARD, useClass: TenantGuard },    // 2. extract tenantId

// Every handler that creates or queries data:
@CommandHandler(CreateOneTodoCommand)
export class CreateOneTodoHandler {
  constructor(
    private readonly todoService: TodoService,
    private readonly tenantContext: TenantContext,
  ) {}

  execute({ args }: CreateOneTodoCommand) {
    return this.todoService.createOne({
      ...args.input,
      tenantId: this.tenantContext.tenantId,  // always from JWT, never from client
    });
  }
}
```



### RBAC — Roles & RolesGuard — "the VIP wristband system"

Role-Based Access Control restricts which operations a user can perform based on their role. Roles are stored on `UserEntity` and included in the JWT payload. The `@Roles()` decorator (built with `SetMetadata`) declares the required roles on a resolver method. `RolesGuard` reads that declaration and checks the current user's roles.

A typical role hierarchy for B2B SaaS:

```typescript
export enum UserRole {
  OWNER  = 'owner',   // full control — billing, members, settings
  ADMIN  = 'admin',   // content and user management, no billing
  MEMBER = 'member',  // standard user — default
  VIEWER = 'viewer',  // read-only
}
```

```typescript
// Declare which roles are required on a mutation
@Mutation(() => TagDto)
@UseGuards(AuthJwtGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OWNER)
createTag(@Args('input') input: CreateTagInput) {
  return this.commandBus.execute(new CreateOneTagCommand({ input }));
}

// RolesGuard reads the @Roles() metadata and checks req.user.roles
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;  // no @Roles() = open to all authenticated users
    const { user } = GqlExecutionContext.create(context).getContext().req;
    return required.some(role => user?.roles?.includes(role));
  }
}
```



### Row-Level Authorization with @Authorize — "the turnstile inside the corridor"

`@Authorize` from `@ptc-org/nestjs-query-graphql` is the deepest layer of data isolation. It attaches a dynamic filter at the **TypeORM query builder level** — not the application level. Every query that touches a type decorated with `@Authorize` automatically has the filter merged in. It's impossible to bypass by crafting a clever GraphQL query.

This is defence in depth. Even if a handler forgets to add `tenantId` to its filter (defence layer 1 — code review), `@Authorize` ensures the query builder always appends `WHERE tenant_id = $1` (defence layer 2 — architectural).

The analogy: guards at the front door are one layer. But `@Authorize` is a **turnstile built into the database corridor itself**. Even if someone slips past the guards, the turnstile is still there. It requires a valid badge to physically reach the data rows. You cannot bribe a turnstile.

```typescript
// todo.authorizer.ts — injected into every query this type participates in
@Injectable()
export class TodoAuthorizer implements CustomAuthorizer<TodoEntity> {
  constructor(private readonly tenantContext: TenantContext) {}

  authorize(_ctx: AuthorizationContext): Promise<Filter<TodoEntity>> {
    return Promise.resolve({ tenantId: { eq: this.tenantContext.tenantId } });
  }

  authorizeRelation(_rel: string, ctx: AuthorizationContext) {
    return this.authorize(ctx);  // apply to relations too
  }
}

// todo.dto.ts — register the authorizer
@Authorize(TodoAuthorizer)
@ObjectType('Todo')
export class TodoDto extends AbstractDto {
  @FilterableField()
  title: string;
  // tenantId is NOT a @FilterableField — clients cannot filter by it
}
```



### Dual-Auth Architecture — "two separate key rings"

Production B2B SaaS needs two distinct authentication portals:

**User Portal** — your customers. Each user authenticates as a member of their tenant. Their JWT is signed with the user RSA key pair. They can only read and write data scoped to their `tenantId`.

**Admin Portal** — your internal support and operations team. Their JWT is signed with a completely different RSA key pair. They can operate across any tenant (with `tenantId` as an explicit argument). A user JWT cannot elevate to admin access — the key pairs are mathematically distinct.

This is not a convention — it's a cryptographic guarantee. Even if a user reverse-engineers your JWT payload format and crafts a token with `role: 'admin'`, the signature will be invalid because they don't have the admin private key.

```typescript
// User-facing operations — standard guard
@Mutation(() => TodoDto)
@UseGuards(AuthJwtGuard)           // validates with JWT_PUBLIC_KEY
createTodo(@Args('input') input: CreateTodoInput) {
  return this.commandBus.execute(new CreateOneTodoCommand({ input }));
  // tenantId comes from TenantContext — client cannot provide it
}

// Admin portal operations — separate guard with a different strategy
@Mutation(() => Boolean)
@UseGuards(PortalAuthJwtGuard)     // validates with ADMIN_JWT_PUBLIC_KEY
adminDeleteTodo(
  @Args('id') id: number,
  @Args('tenantId') tenantId: number,  // admin CAN pass tenantId — they operate cross-tenant
) {
  return this.commandBus.execute(new AdminDeleteOneTodoCommand({ id, tenantId }));
}
```



### Nx Monorepo & Module Boundaries — "the apartment building with bylaws"

An Nx monorepo is one Git repository containing multiple applications and shared libraries. The directory structure:

```
apps/api/          ← NestJS backend (the server)
apps/web/          ← Next.js frontend (the client)
apps/api-e2e/      ← end-to-end tests
libs/contracts/    ← shared TypeScript types — the only legal bridge between apps
```

`@nx/enforce-module-boundaries` is an ESLint rule that prevents apps from importing each other's code directly. If `apps/web` tries to import from `apps/api`, you get a red squiggly in your IDE before CI even runs. Code sharing must go through `libs/`.

`nx affected:test` runs tests only for the projects affected by your current changes. `nx run-many --target=build` builds everything in the correct dependency order.

The analogy: an Nx monorepo is a **well-managed apartment building with strict bylaws**. Each tenant (app) has their own locked unit. The building manager (Nx) enforces that tenants cannot enter each other's units. If Apartment A (web) wants something from Apartment B (api), they use the building intercom (the shared `libs/contracts`). You don't climb through the window. The bylaws are enforced by the building's own alarm (ESLint), not just the manager's word.



### The Full Request Lifecycle — "every layer in one diagram"

Every request in a production NestJS enterprise app flows through this exact pipeline, in this exact order. When something goes wrong, this diagram is the map.

```
Incoming HTTP/WebSocket request
        │
        ▼
[ Middleware ]
  CorrelationId, Logger, CORS, Rate Limiter
        │
        ▼
[ Guards — in registration order ]
  1. AuthJwtGuard    → verify JWT signature (RS256), reject if invalid or expired
  2. TenantGuard     → extract tenantId from req.user, store in TenantContext
  3. RolesGuard      → check user.roles against @Roles() on the handler
        │
        ▼
[ Pipes ]
  ValidationPipe     → validate & transform request body against DTO
        │
        ▼
[ Interceptors — before ]
  TimingInterceptor, CacheInterceptor
        │
        ▼
[ Resolver or Controller ]
  @CurrentUser() injects user
  CommandBus / QueryBus dispatched
        │
        ▼
[ CQRS Handler ]
  One line: service.method(args, tenantId)
        │
        ▼
[ Service ]
  Business logic
  Calls Repository or FilterQueryBuilder
  Publishes EventBus events
  Enqueues Bull jobs
        │
        ▼
[ @Authorize filter merged ]
  TypeORM QueryBuilder: WHERE tenant_id = $1 AND ...
        │
        ▼
[ PostgreSQL ]
  Query executes
        │
        ▼
[ Interceptors — after ]
  Transform response shape, log timing
        │
        ▼
[ Exception Filter ]
  (if anything threw) → consistent, shaped error response
        │
        ▼
Response sent to client
```

Map every concept in this guide to one of those layers. The request lifecycle is the skeleton. Everything else is flesh on the bones.



## The Production Checklist

Before you merge a new feature module, run every item. This is the diff between a tutorial project and a production codebase.

### Entity
- [ ] `tenantId` — `@Column()` + `@RelationId()` + `@Index()` present
- [ ] Migration generated and reviewed — includes `tenantId` with `NOT NULL`
- [ ] `onDelete: 'RESTRICT'` on the tenant FK

### Handlers
- [ ] `TenantContext` injected
- [ ] `tenantId: this.tenantContext.tenantId` on `createOne` input
- [ ] `findMany` filter includes `tenantId: { eq: tenantId }`
- [ ] `findOne` filter includes `tenantId` (prevent cross-tenant GET by ID)
- [ ] `updateOne` filter includes `tenantId` (prevent cross-tenant UPDATE)
- [ ] `deleteOne` filter includes `tenantId` (prevent cross-tenant DELETE)

### DTO
- [ ] `@Authorize(XxxAuthorizer)` on the `@ObjectType` DTO
- [ ] `tenantId` is NOT a `@FilterableField()`
- [ ] `tenantId` is NOT a `@Field()` on any `@InputType`
- [ ] `userId` is NOT a `@Field()` on any create `@InputType`

### Auth
- [ ] `@UseGuards(AuthJwtGuard)` on every mutation and sensitive query
- [ ] Admin-only operations use `PortalAuthJwtGuard`

### RBAC
- [ ] Owner/admin-only mutations have `@Roles(UserRole.ADMIN, UserRole.OWNER)`
- [ ] Viewer-only operations are queries, never mutations

### Tests
- [ ] E2E: Tenant A user cannot read Tenant B's data
- [ ] E2E: Viewer role cannot call an admin mutation
- [ ] E2E: Unauthenticated request is rejected with 401



## Quick Reference

The complete Meteor → NestJS concept map — for when you've come from a framework that "just works" and want to know exactly what replaced what.

| Meteor | NestJS Enterprise | Why |
|---|---|---|
| `meteor create my-app` | `npx create-nx-workspace` | Monorepo manages multiple apps + shared libs |
| `client/` | `apps/web/` (Next.js) | Independently deployable frontend |
| `server/` | `apps/api/` (NestJS) | Independently deployable backend |
| `imports/` (isomorphic) | `libs/contracts/` | Strict type-sharing with explicit boundaries |
| `Mongo.Collection('tasks')` | `@Entity() class TodoEntity` | Schema enforced at DB + TypeScript level |
| MongoDB | PostgreSQL | Relational integrity, migrations, type safety |
| No migrations | TypeORM migrations | Every change versioned and reversible |
| `Meteor.methods({ createTask })` | `@CommandHandler(...)` | Explicit message routing, testable in isolation |
| `Meteor.publish('tasks', fn)` | `@QueryHandler(...)` | Explicit query handler, no magic transport |
| Logic scattered everywhere | Always in `*.service.ts` | One place to find it, test it, reason about it |
| `check(input, String)` | `@IsString()` + `ValidationPipe` | Automatic, global, declarative |
| `throw new Meteor.Error(...)` | `throw new BadRequestException(...)` | Maps to correct HTTP/GraphQL error codes |
| `this.userId` | `@CurrentUser() user` | JWT-verified, typed, injected |
| `.allow({ insert: fn })` | `@UseGuards(AuthJwtGuard)` | Enforced at code level, not collection level |
| `.deny({ remove: fn })` | `ValidationPipe({ forbidNonWhitelisted })` | Global, automatic rejection of unknown fields |
| DDP (WebSocket) | GraphQL over HTTPS | Standard protocol, any HTTP client |
| `Meteor.subscribe('tasks')` | `useQuery(GET_TODOS)` | Explicit, typed, no magic sync |
| DDP reactive subscriptions | GraphQL Subscriptions (Redis PubSub) | Horizontally scalable real-time |
| `Roles.userIsInRole(...)` | `@UseGuards(RolesGuard)` + `@Roles()` | Declarative RBAC at resolver level |
| No multi-tenancy story | `tenantId` + `TenantGuard` + `@Authorize` | Architecture-level isolation — not developer memory |
| Single shared secret auth | RS256 JWT (separate key pairs) | Downstream services can't forge tokens |
| `meteor deploy` | Docker → ECS Fargate / Kubernetes | Container-based, cloud-agnostic, scalable |
| `Meteor.settings` | `.env` + `ConfigModule` + Joi schema | App refuses to start on missing config |
| No queue system | Bull (Redis-backed) | Async processing — emails, AI, notifications |
| In-memory reactive data | Redis PubSub | Scales across multiple server instances |



## The Point of All of This

NestJS doesn't feel weird because it's complicated. It feels weird because it's **explicit**.

Every decision that a framework like Meteor makes for you — NestJS makes you make yourself, in code, where it is visible, testable, and changeable. The vocabulary exists because each concept solves a specific problem at a specific layer:

- **Modules** prevent spaghetti dependencies
- **Guards** prevent unauthorised access
- **Pipes** prevent malformed data
- **DTOs** prevent the database from seeing client-controlled fields
- **CQRS** prevents business logic from spreading across the entire codebase
- **tenantId + TenantGuard + @Authorize** prevent a user from ever seeing another tenant's data

Once you know the vocabulary, writing a new feature is a repeatable 9-step checklist. Any developer on the team can pick up any module and immediately know where to find the business logic, the validation, the data shape, and the tests.

That's not weird. That's architecture.

