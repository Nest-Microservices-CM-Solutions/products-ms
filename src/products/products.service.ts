import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma.service';
import { Console, error } from 'console';
import { PrismaClient } from '../generated/prisma/client';
import { PaginationDto } from '../common';
import { metadata } from 'reflect-metadata/no-conflict';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class ProductsService implements OnModuleInit{

  private readonly logger = new Logger(`ProductService`);

  constructor(
    private readonly prisma: PrismaService
  ) {}

  async onModuleInit() {
    await this.prisma.$connect();
    this.logger.log('Database connected');
  }

  create(createProductDto: CreateProductDto) {

    return this.prisma.product.create({
      data:createProductDto
    });
  }

  async findAll(PaginationDto:PaginationDto) {
    const {page=1,limit=10} = PaginationDto;
    
    const totalPage = await this.prisma.product.count({where :{available:true}});
    const lastPage = Math.ceil(totalPage / limit);
    
    if (page > lastPage && totalPage > 0) {
      throw new NotFoundException(`Page not found ${page}`);
    }

    return {
        data :await this.prisma.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where:{available:true}
      }),
      meta:{
        total: totalPage,
        page : page,
        lastPage:lastPage
      }
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where:{id,
        available:true
      }
    });
    
    if(!product){
      throw new NotFoundException('Product with id #'+ id +' not found')
    }

    return product;
  }

 async update(id: number, updateProductDto: UpdateProductDto) {
    
  const { id: _, ...data} = updateProductDto;
  
  await this.findOne(id);

    return this.prisma.product.update({
      where: {id},
      data:data,
    });

  }

  async remove(id: number) {
    await this.findOne(id);
    
    const product = await this.prisma.product.update({
      where: {id},
      data:{
        available:false
      },
    });

    return product;
    // return this.prisma.product.delete({
    //   where:{id}
    // });
  }
}
