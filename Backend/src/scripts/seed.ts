import { config } from '../config/index.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { UserModel, DoctorModel, AppointmentModel, RefreshTokenModel } from '../models/index.js';
import { hashPassword } from '../shared/utils/password.js';
import logger from '../shared/utils/logger.js';

const specialties = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Urology',
];

const degrees = ['MD', 'MBBS', 'DO', 'MS', 'DM', 'MCh'];

const experienceLevels = ['5 years', '8 years', '10 years', '12 years', '15 years', '20 years'];

const firstNames = [
  'John',
  'Jane',
  'Michael',
  'Sarah',
  'David',
  'Emily',
  'James',
  'Lisa',
  'Robert',
  'Maria',
  'William',
  'Jennifer',
  'Christopher',
  'Amanda',
  'Daniel',
];

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Anderson',
  'Taylor',
  'Thomas',
  'Moore',
];

const streets = [
  'Main St',
  'Oak Ave',
  'Park Blvd',
  'Elm St',
  'Maple Dr',
  'Cedar Ln',
  'Pine Rd',
  'Washington Ave',
  'Lincoln Blvd',
  'Jefferson St',
];

const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];
const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA'];
const zipCodes = ['10001', '90001', '60601', '77001', '85001', '19101'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(): string {
  return `${getRandomInt(200, 999)}-${getRandomInt(200, 999)}-${getRandomInt(1000, 9999)}`;
}

function generateAddress() {
  const streetNum = getRandomInt(1, 9999);
  const street = getRandomElement(streets);
  const city = getRandomElement(cities);
  const state = getRandomElement(states);
  const zip = getRandomElement(zipCodes);
  return {
    line1: `${streetNum} ${street}`,
    line2: `Apt ${getRandomInt(1, 100)}`,
    city,
    state,
    zip,
  };
}

function generateDateOfBirth(): string {
  const year = getRandomInt(1950, 2005);
  const month = getRandomInt(1, 12);
  const day = getRandomInt(1, 28);
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

async function seedDatabase() {
  logger.info('Starting database seeding...');

  try {
    // Connect to database
    await connectDatabase();

    // Clear existing data
    await Promise.all([
      UserModel.deleteMany({}),
      DoctorModel.deleteMany({}),
      AppointmentModel.deleteMany({}),
      RefreshTokenModel.deleteMany({}),
    ]);
    logger.info('Cleared existing data');

    // Create admin user
    const adminPassword = await hashPassword('admin123');
    const admin = new UserModel({
      name: 'Admin User',
      email: 'admin@mediconnect.com',
      password: adminPassword,
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      address: { line1: '123 Admin St', line2: 'Suite 100' },
      gender: 'Not Selected',
      dob: '1980-01-01',
      phone: '0000000000',
      role: 'ADMIN',
      isVerified: true,
    });
    await admin.save();
    logger.info('Created admin user');

    // Create patients
    const patients = [];
    for (let i = 0; i < 20; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@patient.com`;
      const password = await hashPassword('password123');
      const address = generateAddress();

      const patient = new UserModel({
        name: `${firstName} ${lastName}`,
        email,
        password,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        address,
        gender: getRandomElement(['Male', 'Female', 'Other']),
        dob: generateDateOfBirth(),
        phone: generatePhone(),
        role: 'PATIENT',
        isVerified: true,
      });
      await patient.save();
      patients.push(patient);
    }
    logger.info(`Created ${patients.length} patients`);

    // Create doctors
    const doctors = [];
    for (let i = 0; i < 15; i++) {
      const firstName = getRandomElement(firstNames);
      const lastName = getRandomElement(lastNames);
      const email = `dr.${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@mediconnect.com`;
      const password = await hashPassword('password123');
      const address = generateAddress();
      const specialty = getRandomElement(specialties);
      const degree = getRandomElement(degrees);
      const experience = getRandomElement(experienceLevels);
      const fees = getRandomInt(500, 3000);

      const doctor = new DoctorModel({
        name: `Dr. ${firstName} ${lastName}`,
        email,
        password,
        image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        speciality: specialty,
        degree,
        experience,
        about: `Experienced ${specialty} specialist with ${experience} of practice. Dedicated to providing quality care to patients.`,
        available: true,
        isVerified: i < 12, // First 12 doctors are verified
        fees,
        address,
        slotDuration: 30,
        slots_booked: {},
        date: new Date(),
        availability: Array.from({ length: 5 }, (_, day) => ({
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          breakStart: '13:00',
          breakEnd: '14:00',
          isActive: true,
        })),
        leave: [],
      });
      await doctor.save();
      doctors.push(doctor);
    }
    logger.info(`Created ${doctors.length} doctors`);

    // Create some appointments
    const statuses: Array<'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'> = [
      'PENDING',
      'CONFIRMED',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
    ];
    const paymentStatuses: Array<'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED'> = [
      'PENDING',
      'PAID',
      'REFUNDED',
      'FAILED',
    ];

    for (let i = 0; i < 50; i++) {
      const patient = getRandomElement(patients);
      const doctor = getRandomElement(doctors);
      const status = getRandomElement(statuses);
      const paymentStatus = status === 'COMPLETED' ? 'PAID' : getRandomElement(paymentStatuses);

      // Generate a slot date within the next 30 days
      const slotDate = new Date();
      slotDate.setDate(slotDate.getDate() + getRandomInt(0, 30));

      // Generate slot time between 9 AM and 4 PM
      const hour = getRandomInt(9, 15);
      const minute = getRandomElement([0, 30]);
      const slotStart = new Date(slotDate);
      slotStart.setHours(hour, minute, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + (doctor.slotDuration || 30));

      const appointment = new AppointmentModel({
        userId: patient._id,
        doctorId: doctor._id,
        slotDate: slotStart.toISOString().split('T')[0],
        slotTime: slotStart.toTimeString().slice(0, 5),
        slotStart,
        slotEnd,
        amount: doctor.fees,
        status,
        paymentStatus,
        paymentId:
          paymentStatus === 'PAID'
            ? `pay_${Math.random().toString(36).substring(2, 15)}`
            : undefined,
        cancellationReason: status === 'CANCELLED' ? 'Patient requested cancellation' : undefined,
        cancelledBy: status === 'CANCELLED' ? 'PATIENT' : undefined,
        cancelledAt: status === 'CANCELLED' ? new Date() : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        consultationNotes:
          status === 'COMPLETED' ? 'Patient recovered well. Follow up in 2 weeks.' : undefined,
        userData: {
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
          address: patient.address,
        },
        docData: {
          name: doctor.name,
          email: doctor.email,
          speciality: doctor.speciality,
          degree: doctor.degree,
          fees: doctor.fees,
          address: doctor.address,
        },
      });
      await appointment.save();
    }
    logger.info('Created 50 appointments');

    logger.info('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Database seeding failed');
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

seedDatabase();
