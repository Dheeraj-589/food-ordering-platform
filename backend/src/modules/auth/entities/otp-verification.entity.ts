import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum OtpType {
  REGISTER = 'register',
  LOGIN = 'login',
  FORGOT_PASSWORD = 'forgot_password',
}

@Entity('otp_verifications')
export class OtpVerification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  email!: string;

  @Column({ type: 'varchar', length: 6 })
  otp!: string;

  @Column({
    type: 'enum',
    enum: OtpType,
  })
  type!: OtpType;

  @Column({ type: 'timestamp' })
  expiry!: Date;

  @Column({ type: 'text', nullable: true })
  registrationData?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
