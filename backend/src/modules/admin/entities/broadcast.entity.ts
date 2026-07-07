import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('broadcasts')
export class Broadcast {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'text' })
  message!: string;

  @CreateDateColumn()
  sentAt!: Date;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: 'pending' | 'success' | 'failed';

  @Column({ type: 'int', default: 0 })
  recipientsCount!: number;

  @Column({ type: 'longtext', nullable: true })
  deliveryDetails?: string; // Serialized JSON array of recipient delivery status
}
