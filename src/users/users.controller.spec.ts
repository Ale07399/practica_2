import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException, HttpStatus, HttpException } from '@nestjs/common';

const mockUser = { id: 1, name: 'Test User', email: 'Test email@gmail.com' , password: 'Test password'};

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue(mockUser),
            findAll: jest.fn().mockResolvedValue([mockUser]),
            findByTitle: jest.fn().mockResolvedValue([mockUser]),
            findOne: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn().mockResolvedValue(mockUser),
            remove: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a user', async () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User', 
      email: 'Test email@gmail.com' , 
      password: 'Test password'
    };

    const result = await controller.create(createUserDto);
    expect(result).toEqual(mockUser);
    expect(service.create).toHaveBeenCalledWith(createUserDto);
  });

  it('should throw an error if email already exists', async () => {
    const createUserDto: CreateUserDto = {
      name: 'Test User',
      email: 'Test email@gmail.com',  
      password: 'Test password'
    };
  
    jest.spyOn(service, 'create').mockRejectedValue(
      new HttpException('Email already exists', HttpStatus.BAD_REQUEST),
    );
  
    await expect(controller.create(createUserDto)).rejects.toThrow(HttpException);
    await expect(controller.create(createUserDto)).rejects.toThrow('Email already exists');
  
    expect(service.create).toHaveBeenCalledWith(createUserDto);
  });
  

  it('should find all users', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockUser]);
    expect(service.findAll).toHaveBeenCalled();
  });


  it('should find a user by ID', async () => {
    const result = await controller.findOne('1');
    expect(result).toEqual(mockUser);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('should throw NotFoundException when user is not found', async () => {
    jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());
    await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
  });

  it('should update a user', async () => {
    const updateUserDto: UpdateUserDto = {
      name: 'Updated Test User',
      email: 'Updated Test Email',
    };

    const result = await controller.update('1', updateUserDto);
    expect(result).toEqual(mockUser);
    expect(service.update).toHaveBeenCalledWith(1, updateUserDto);
  });

  it('should throw NotFoundException when updating a non-existing user', async () => {
    jest.spyOn(service, 'update').mockRejectedValue(new NotFoundException());
    const updateUserDto: UpdateUserDto = {
      name: 'Non-existent User',
      email: 'Non-existent email',
    };
    await expect(controller.update('999', updateUserDto)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should delete a user', async () => {
    const result = await controller.remove('1');
    expect(result).toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith(1);
  });

  it('should throw NotFoundException when deleting a non-existing user', async () => {
    jest.spyOn(service, 'remove').mockRejectedValue(new NotFoundException());
    await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
  });
});
