# Coding Standards

**Project:** MediConnect  
**Version:** 1.0  
**Date:** 2026-11-06  
**Status:** Draft (from existing conventions + Phase 2 TypeScript/ESLint rules)

---

## 1. Language & Runtime

| Aspect | Standard |
|--------|----------|
| Language | TypeScript 5.x (strict mode) |
| Runtime | Node.js 18+ (ES Modules) |
| Module System | ES Modules (`import`/`export`) |
| Target | ES2022 |

---

## 2. File Organization

### Structure (Post-Phase 2)
```
src/
├── config/           # Configuration modules
├── modules/          # Feature modules (domain-driven)
│   ├── auth/
│   ├── users/
│   ├── doctors/
│   ├── appointments/
│   └── admin/
├── shared/           # Cross-cutting concerns
│   ├── middleware/
│   ├── utils/
│   ├── types/
│   └── constants/
├── app.ts            # Express app setup
└── server.ts         # Entry point
```

### Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Files (TS) | kebab-case | `auth-service.ts`, `user-repository.ts` |
| Classes | PascalCase | `UserService`, `AppointmentRepository` |
| Interfaces | PascalCase + `I` prefix | `IUser`, `IDoctorAvailability` |
| Types | PascalCase | `AppointmentStatus`, `PaginationParams` |
| Functions/Variables | camelCase | `getUserById`, `isSlotAvailable` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_PAGE_SIZE`, `JWT_SECRET` |
| Enums | PascalCase | `UserRole`, `AppointmentStatus` |

---

## 3. TypeScript Rules (Strict Mode)

```json
// tsconfig.json key settings
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Type Patterns

**Prefer interfaces for object shapes:**
```typescript
interface IUser {
  id: string;
  name: string;
  email: string;
}
```

**Use type aliases for unions, primitives, tuples:**
```typescript
type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
type PaginationParams = { page: number; limit: number; sortBy?: string };
```

**Avoid `any` — use `unknown` or proper types:**
```typescript
// Bad
function process(data: any) { }

// Good
function process(data: unknown) { }
function process<T>(data: T) { }
```

**Use `Readonly` for immutable data:**
```typescript
function getConfig(): Readonly<AppConfig> { return config; }
```

**Use `Partial`, `Pick`, `Omit` for derived types:**
```typescript
type UserCreateInput = Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>;
type UserUpdateInput = Partial<UserCreateInput>;
```

---

## 4. Code Style (ESLint + Prettier)

### Prettier Config
```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### ESLint Rules (Key)
```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/await-thenable': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  }
};
```

---

## 5. Module Patterns

### Repository Pattern (Data Access)
```typescript
// Base repository
abstract class BaseRepository<T extends Document> {
  protected constructor(protected model: Model<T>) {}

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async create(data: Partial<T>): Promise<T> {
    return this.model.create(data);
  }

  // ... other CRUD methods
}

// Concrete repository
@Injectable()
class UserRepository extends BaseRepository<IUser> {
  constructor(@InjectModel('User') model: Model<IUser>) {
    super(model);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.model.findOne({ email }).exec();
  }
}
```

### Service Pattern (Business Logic)
```typescript
@Injectable()
class AppointmentService {
  constructor(
    private appointmentRepo: AppointmentRepository,
    private doctorRepo: DoctorRepository
  ) {}

  async bookAppointment(data: BookAppointmentInput): Promise<IAppointment> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Business logic here
      const appointment = await this.appointmentRepo.create(data, { session });
      await this.doctorRepo.addBookedSlot(data.doctorId, data.slotStart, { session });
      await session.commitTransaction();
      return appointment;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  }
}
```

### Controller Pattern (HTTP Only)
```typescript
class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  @Post()
  @Validate(BookAppointmentSchema)
  async bookAppointment(req: AuthenticatedRequest, res: Response) {
    const appointment = await this.appointmentService.bookAppointment({
      ...req.body,
      userId: req.user!.id
    });
    return ApiResponse.created(res, appointment, 'Appointment booked');
  }
}
```

---

## 6. Error Handling

### Custom Error Classes
```typescript
abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  constructor(message: string) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  constructor(public details: ZodError) {
    super('Validation failed');
  }
}

class NotFoundError extends AppError {
  statusCode = 404;
  code = 'NOT_FOUND';
  constructor(resource: string) { super(`${resource} not found`); }
}

class ConflictError extends AppError {
  statusCode = 409;
  code = 'CONFLICT';
  constructor(message: string) { super(message); }
}

class UnauthorizedError extends AppError {
  statusCode = 401;
  code = 'UNAUTHORIZED';
  constructor(message = 'Authentication required') { super(message); }
}

class ForbiddenError extends AppError {
  statusCode = 403;
  code = 'FORBIDDEN';
  constructor(message = 'Insufficient permissions') { super(message); }
}
```

### Centralized Error Handler
```typescript
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return ApiResponse.error(res, err.statusCode, err.code, err.message, err.details);
  }
  if (err instanceof ZodError) {
    return ApiResponse.error(res, 400, 'VALIDATION_ERROR', 'Invalid input', err.errors);
  }
  logger.error({ err, path: req.path }, 'Unhandled error');
  return ApiResponse.error(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}
```

---

## 7. API Response Format

### Standard Response Utility
```typescript
class ApiResponse {
  static success<T>(res: Response, data: T, message = 'Success', meta?: PaginationMeta) {
    return res.status(200).json({ success: true, data, message, meta });
  }

  static created<T>(res: Response, data: T, message = 'Created') {
    return res.status(201).json({ success: true, data, message });
  }

  static error(res: Response, statusCode: number, code: string, message: string, details?: any) {
    return res.status(statusCode).json({ success: false, error: { code, message, details } });
  }
}
```

---

## 8. Validation (Zod)

### Schema Organization
```typescript
// shared/schemas/common.ts
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
});

// modules/users/schemas.ts
export const CreateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(128),
  }),
});

export const UpdateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().regex(/^\+?\d{10,15}$/).optional(),
    // ...
  }),
  params: z.object({ id: z.string() }),
});
```

### Validation Middleware
```typescript
function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) {
      throw new ValidationError(result.error);
    }
    req.validated = result.data;
    next();
  };
}
```

---

## 9. Async/Await Patterns

```typescript
// Always use try/catch or let errors bubble to handler
async function getUser(id: string): Promise<IUser> {
  const user = await userRepo.findById(id);
  if (!user) throw new NotFoundError('User');
  return user;
}

// Parallel operations when independent
async function getDashboardData(userId: string) {
  const [appointments, notifications, profile] = await Promise.all([
    appointmentRepo.findByUser(userId),
    notificationRepo.findUnread(userId),
    userRepo.findById(userId),
  ]);
  return { appointments, notifications, profile };
}

// Sequential when dependent
async function bookAndNotify(data: BookInput) {
  const appointment = await appointmentService.book(data);
  await notificationService.send(appointment.userId, 'booking_confirmed', appointment);
  return appointment;
}
```

---

## 10. Testing Patterns

### Unit Test (Service)
```typescript
describe('AppointmentService', () => {
  let service: AppointmentService;
  let appointmentRepo: Mock<AppointmentRepository>;
  let doctorRepo: Mock<DoctorRepository>;

  beforeEach(() => {
    appointmentRepo = createMock();
    doctorRepo = createMock();
    service = new AppointmentService(appointmentRepo, doctorRepo);
  });

  it('books appointment when slot available', async () => {
    doctorRepo.findById.mockResolvedValue(doctorWithAvailableSlot);
    appointmentRepo.create.mockResolvedValue(newAppointment);

    const result = await service.bookAppointment(validInput);

    expect(result).toEqual(newAppointment);
    expect(doctorRepo.addBookedSlot).toHaveBeenCalledWith(doctorId, slotStart);
  });

  it('throws ConflictError when slot taken', async () => {
    doctorRepo.findById.mockResolvedValue(doctorWithBookedSlot);

    await expect(service.bookAppointment(validInput)).rejects.toThrow(ConflictError);
  });
});
```

---

## 11. Git Commit Conventions

### Conventional Commits
```
type(scope): short imperative summary

<body explaining what changed and why>

Types: feat, fix, refactor, test, docs, chore, perf, ci, style
Scopes: auth, users, doctors, appointments, admin, config, db, docs, etc.

Examples:
feat(auth): add refresh token rotation
fix(appointments): prevent double-booking with unique index
refactor(users): extract repository layer
test(appointments): add concurrency test for booking
docs(architecture): add sequence diagrams
chore(deps): update mongoose to 9.9.4
```

---

## 12. Code Review Checklist

- [ ] Types are explicit, no `any`
- [ ] Error handling uses custom error classes
- [ ] Validation schemas exist for all inputs
- [ ] Tests cover happy path + edge cases
- [ ] No console.log in production code (use logger)
- [ ] No secrets or credentials in code
- [ ] Commits are atomic and follow conventional format
- [ ] Documentation updated for API changes

---

*These standards are derived from the existing JavaScript codebase conventions and enhanced for TypeScript strict mode with ESLint/Prettier enforcement.*
