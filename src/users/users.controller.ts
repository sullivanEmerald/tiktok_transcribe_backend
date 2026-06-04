import { Controller, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('overview')
    async getProfile(@CurrentUser() user: any) {
        console.log('the user', user)
        return this.usersService.getProfile(user.guestId);
    }

}
