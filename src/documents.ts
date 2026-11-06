import { randomUUID } from 'node:crypto';
import { Body, Controller, Delete, Get, HttpCode, Injectable, NotFoundException, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateDocument {
  @IsString()
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @Length(1, 120)
  title!: string;

  @IsString()
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @Length(1, 20000)
  content!: string;
}

export class ListDocuments {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}

interface DocumentRecord { id: string; title: string; content: string; createdAt: string }

@Injectable()
export class DocumentsService {
  private readonly documents = new Map<string, DocumentRecord>();

  create(input: CreateDocument): DocumentRecord {
    const document = { id: randomUUID(), title: input.title, content: input.content, createdAt: new Date().toISOString() };
    this.documents.set(document.id, document);
    return { ...document };
  }

  list(limit: number) {
    // Lists return metadata; full content is retrieved through the detail route.
    return { total: this.documents.size, items: [...this.documents.values()].slice(-limit).reverse()
      .map(({ id, title, createdAt }) => ({ id, title, createdAt })) };
  }

  get(id: string): DocumentRecord {
    const document = this.documents.get(id);
    if (!document) throw new NotFoundException('Document not found');
    return { ...document };
  }

  remove(id: string): void {
    if (!this.documents.delete(id)) throw new NotFoundException('Document not found');
  }
}

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post() create(@Body() input: CreateDocument) { return this.documents.create(input); }
  @Get() list(@Query() query: ListDocuments) { return this.documents.list(query.limit); }
  @Get(':id') get(@Param('id', new ParseUUIDPipe()) id: string) { return this.documents.get(id); }
  @Delete(':id') @HttpCode(204) remove(@Param('id', new ParseUUIDPipe()) id: string) { this.documents.remove(id); }
}
