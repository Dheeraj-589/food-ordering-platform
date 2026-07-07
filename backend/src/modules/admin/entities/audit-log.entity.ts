import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  action!: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  userName?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  userEmail?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
