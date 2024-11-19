import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as request from 'supertest';

import { User } from './entities/user.entity'; // Ajuste la ruta según tu estructura actual
import { UsersModule } from './users.module'; // Ajuste la ruta según tu estructura actual
import { CreateUserDto } from './dto/create-user.dto'; // Ajuste la ruta según tu estructura actual
import { UpdateUserDto } from './dto/update-user.dto'; // Ajuste la ruta según tu estructura actual

describe('Pruebas de aceptación para usuarios', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        UsersModule,
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: 'localhost',
          port: 3306,
          username: 'root',
          password: '',
          database: 'test_users_db',
          entities: [User],
          synchronize: true,
        }),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    userRepo = moduleRef.get<Repository<User>>(getRepositoryToken(User));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    await userRepo.query('DELETE FROM user;');
  });

  it('Debería crear un usuario y retornarlo en la respuesta', async () => {
    const nuevoUsuario: CreateUserDto = {
      name: 'user de prueba',
      email: 'email@gmail.com',
      password: 'password de prueba'
    };

    const respuestaCrear = await request(app.getHttpServer())
      .post('/users')
      .send(nuevoUsuario);

    expect(respuestaCrear.status).toBe(201);
    expect(respuestaCrear.body.name).toEqual(nuevoUsuario.name);
    expect(respuestaCrear.body.email).toEqual(nuevoUsuario.email);
  });

  it('Debería lanzar un error si el email ya existe', async () => {
    const nuevoUsuario: CreateUserDto = {
      name: 'user de prueba',
      email: 'email@gmail.com',
      password: 'password123'
    };

    await request(app.getHttpServer()).post('/users').send(nuevoUsuario);

    const respuestaDuplicada = await request(app.getHttpServer())
      .post('/users')
      .send(nuevoUsuario);

    expect(respuestaDuplicada.status).toBe(400);
    expect(respuestaDuplicada.body.message).toBe('Email already exists');
  });

  it('Debería obtener todos los usuarios', async () => {
    const respuestaObtener = await request(app.getHttpServer()).get('/users');

    expect(respuestaObtener.status).toBe(200);
    expect(Array.isArray(respuestaObtener.body)).toBeTruthy();
  });

  it('Debería buscar un usuario por ID', async () => {
    const nuevoUsuario = await userRepo.save({
      name: 'Usuario de ejemplo',
      email: 'ejemplo@email.com',
      password: 'password123',
    });

    const respuestaBuscar = await request(app.getHttpServer()).get(`/users/${nuevoUsuario.id}`);

    expect(respuestaBuscar.status).toBe(200);
    expect(respuestaBuscar.body.name).toEqual(nuevoUsuario.name);
    expect(respuestaBuscar.body.email).toEqual(nuevoUsuario.email);
  });

  it('Debería lanzar NotFoundException al no encontrar un usuario por ID', async () => {
    const userInexistente = 999;

    const respuestaBuscar = await request(app.getHttpServer()).get(`/users/${userInexistente}`);
    expect(respuestaBuscar.status).toBe(404);
  });

  it('Debería actualizar un usuario existente', async () => {
    const nuevoUsuario = await userRepo.save({
      name: 'Usuario para actualizar',
      email: 'actualizar@email.com',
      password: 'password123',
    });

    const nuevaData: UpdateUserDto = {
      name: 'Usuario actualizado',
      email: 'actualizado@email.com',
    };

    const respuestaActualizar = await request(app.getHttpServer())
      .put(`/users/${nuevoUsuario.id}`)
      .send(nuevaData);

    expect(respuestaActualizar.status).toBe(200);
    expect(respuestaActualizar.body.name).toEqual(nuevaData.name);
    expect(respuestaActualizar.body.email).toEqual(nuevaData.email);
  });

  it('Debería lanzar un error si se intenta actualizar un usuario con un email que ya existe', async () => {
    const usuarioExistente = await userRepo.save({
      name: 'Usuario existente',
      email: 'existente@email.com',
      password: 'password123',
    });

    const usuarioAActualizar = await userRepo.save({
      name: 'Usuario para actualizar',
      email: 'otro@email.com',
      password: 'password123',
    });

    const nuevaData: UpdateUserDto = {
      name: 'Usuario actualizado',
      email: 'existente@email.com',
    };

    const respuestaActualizar = await request(app.getHttpServer())
      .put(`/users/${usuarioAActualizar.id}`)
      .send(nuevaData);

    expect(respuestaActualizar.status).toBe(400);
    expect(respuestaActualizar.body.message).toBe('Email already exists');
  });

  it('Debería lanzar NotFoundException al no encontrar un usuario para actualizar', async () => {
    const userInexistente = 999;
    const nuevaData: UpdateUserDto = {
      name: 'Usuario actualizado',
      email: 'actualizado@email.com',
    };

    const respuestaActualizar = await request(app.getHttpServer())
      .put(`/users/${userInexistente}`)
      .send(nuevaData);

    expect(respuestaActualizar.status).toBe(404);
  });

  it('Debería eliminar un usuario existente', async () => {
    const nuevoUsuario = await userRepo.save({
      name: 'Usuario para eliminar',
      email: 'eliminar@email.com',
      password: 'password123',
    });

    const respuestaEliminar = await request(app.getHttpServer()).delete(`/users/${nuevoUsuario.id}`);
    expect(respuestaEliminar.status).toBe(200);
  });

  it('Debería lanzar NotFoundException al no encontrar un usuario para eliminar', async () => {
    const userInexistente = 999;

    const respuestaEliminar = await request(app.getHttpServer()).delete(`/users/${userInexistente}`);
    expect(respuestaEliminar.status).toBe(404);
  });
});
