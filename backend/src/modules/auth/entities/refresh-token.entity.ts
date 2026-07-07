import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 500, unique: true })
  token!: string;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'timestamp' })
  expiry!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
