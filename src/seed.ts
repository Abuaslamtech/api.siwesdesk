import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Role } from './common/enums/role.enum';
import { UsersService } from './users/users.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const seeds = [
    {
      name: 'SIWES Director',
      email: 'director@alhikmah.edu.ng',
      password: 'ChangeMe@123',
      role: Role.DIRECTOR,
    },
    {
      name: 'SIWES Corper',
      email: 'corper@alhikmah.edu.ng',
      password: 'ChangeMe@123',
      role: Role.CORPER,
    },
    {
      name: 'Administrative Secretary',
      email: 'adminsecretary@alhikmah.edu.ng',
      password: 'ChangeMe@123',
      role: Role.CORPER,
    },
  ];

  for (const user of seeds) {
    try {
      await usersService.create(user);
      console.log(`Created ${user.email}`);
    } catch (error) {
      console.log(`Skipped ${user.email}: ${(error as Error).message}`);
    }
  }

  await app.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
