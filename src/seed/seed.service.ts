import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { PokeResponse } from './interfaces/poke-response.interface';
import { Model } from 'mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class SeedService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async executeSEED() {
    await this.pokemonModel.deleteMany({});

    const { data } = await firstValueFrom(
      this.httpService
        .get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650')
        .pipe(
          catchError((error: AxiosError) => {
            console.error(error.response.data);
            throw 'An error happened!';
          }),
        ),
    );

    const pokemonToInsert: { name: string; no: number }[] = [];

    data.results.map(({ name, url }) => {
      const segments = url.split('/');
      const no: number = +segments[segments.length - 2];
      pokemonToInsert.push({ name, no });
    });

    await this.pokemonModel.insertMany(pokemonToInsert);

    return 'Seed Executed';
  }
}
