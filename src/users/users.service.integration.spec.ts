import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, HttpStatus, HttpException } from '@nestjs/common';

describe('Pruebas de integración de UsersService', () => {
  let userService: UsersService;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'root',
          password: '',
          database: 'usuarios_pruebas_integracion_db',
          entities: [User],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([User]),
      ],
      providers: [UsersService],
    }).compile();

    userService = testModule.get<UsersService>(UsersService);
    userRepo = testModule.get<Repository<User>>(getRepositoryToken(User));
  });

  afterAll(async () => {
    const dbConnection = userRepo.manager.connection;
    if (dbConnection.isInitialized) {
      await dbConnection.destroy();
    }
  });

  afterEach(async () => {
    await userRepo.query('TRUNCATE TABLE user;');
  });

  it('crea un usuario nuevo en la base de datos', async () => {
    const userPayload = {
      name: 'Carlos López',
      email: 'carlos.lopez@example.com',
      password: 'claveSegura123',
    };

    const createdUser = await userService.create(userPayload);
    expect(createdUser).toHaveProperty('id');
    expect(createdUser.name).toBe(userPayload.name);
    expect(createdUser.email).toBe(userPayload.email);

    const dbUser = await userRepo.findOneBy({ id: createdUser.id });
    expect(dbUser).toBeDefined();
    expect(dbUser.name).toBe(userPayload.name);
    expect(dbUser.email).toBe(userPayload.email);
  });

  it('Debe lanzar una excepción BadRequestException si el correo ya está registrado', async () => {
    const userPayload = {
      name: 'Ana Torres',
      email: 'ana.torres@example.com',
      password: 'password123',
    };

    await userService.create(userPayload);

    await expect(userService.create(userPayload)).rejects.toThrow(BadRequestException);
  });

  it('Debe recuperar todos los usuarios registrados', async () => {
    await userRepo.save([
      { name: 'Usuario Alpha', email: 'alpha@example.com', password: 'clave1' },
      { name: 'Usuario Beta', email: 'beta@example.com', password: 'clave2' },
    ]);

    const users = await userService.findAll();
    expect(users.length).toBe(2);
    expect(users[0].name).toBe('Usuario Alpha');
    expect(users[1].name).toBe('Usuario Beta');
  });

  it('Debe buscar un usuario por su ID', async () => {
    const newUser = await userRepo.save({
      name: 'Usuario Prueba',
      email: 'prueba.usuario@example.com',
      password: 'passwordTest',
    });

    const foundUser = await userService.findOne(newUser.id);
    expect(foundUser).toBeDefined();
    expect(foundUser.name).toBe('Usuario Prueba');
    expect(foundUser.email).toBe('prueba.usuario@example.com');
  });

  it('Debe lanzar NotFoundException si no se encuentra el usuario por su ID', async () => {
    const invalidId = 12345;
    await expect(userService.findOne(invalidId)).rejects.toThrow(NotFoundException);
  });

  it('Debe actualizar un usuario existente', async () => {
    const userToUpdate = await userRepo.save({
      name: 'Usuario Original',
      email: 'original@example.com',
      password: 'password123',
    });

    const updatedUser = await userService.update(userToUpdate.id, {
      name: 'Usuario Modificado',
      email: 'modificado@example.com',
    });
    

    expect(updatedUser).toBeDefined();
    expect(updatedUser.name).toBe('Usuario Modificado');
    expect(updatedUser.email).toBe('modificado@example.com');

    const dbUser = await userRepo.findOneBy({ id: userToUpdate.id });
    expect(dbUser).toBeDefined();
    expect(dbUser.name).toBe(updatedUser.name);
    expect(dbUser.email).toBe(updatedUser.email);
  });

  it('Debe lanzar NotFoundException si se intenta actualizar un usuario inexistente', async () => {
    const invalidId = 12345;
    await expect(userService.update(invalidId, { name: 'Nuevo Nombre' }, {
      name: 'Usuario No_Existente',
      email: 'no.existe@example.com',
      password: 'password123',
    })).rejects.toThrow(NotFoundException);
  });

  it('Debe eliminar un usuario existente', async () => {
    const userToDelete = await userRepo.save({
      name: 'Usuario para Borrar',
      email: 'borrar@example.com',
      password: 'password123',
    });

    await expect(userService.remove(userToDelete.id)).resolves.toBeDefined();

    const deletedUser = await userRepo.findOneBy({ id: userToDelete.id });
    expect(deletedUser).toBeNull();
  });

  it('Debe lanzar NotFoundException si se intenta eliminar un usuario que no existe', async () => {
    const invalidId = 12345;
    await expect(userService.remove(invalidId)).rejects.toThrow(NotFoundException);
  });
});
