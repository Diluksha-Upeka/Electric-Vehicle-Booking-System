const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const User = require('../models/User');

let mongoServer;
let app;
let authToken;
let testUser;
let testStation;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  
  app = require('../server');

  // Create test user
  testUser = await User.create({
    email: 'user@test.com',
    password: 'user123',
    name: 'Test User'
  });

  // Create test station
  testStation = await Station.create({
    name: 'Test Station',
    location: {
      type: 'Point',
      coordinates: [0, 0]
    },
    address: '123 Test St',
    chargingPoints: [
      {
        type: 'Type 2',
        power: 22,
        status: 'available'
      }
    ],
    operatingHours: {
      open: '08:00',
      close: '20:00'
    }
  });

  // Get auth token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'user@test.com',
      password: 'user123'
    });
  
  authToken = loginResponse.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Booking.deleteMany({});
});

describe('Bookings API', () => {
  const testBooking = {
    station: null, // Will be set in beforeEach
    startTime: new Date(Date.now() + 3600000), // 1 hour from now
    endTime: new Date(Date.now() + 7200000), // 2 hours from now
    chargingPoint: 0, // First charging point
    status: 'pending'
  };

  beforeEach(() => {
    testBooking.station = testStation._id;
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testBooking)
        .expect(201);

      expect(response.body).toHaveProperty('station');
      expect(response.body).toHaveProperty('startTime');
      expect(response.body).toHaveProperty('endTime');
      expect(response.body.status).toBe('pending');
    });

    it('should not create booking without auth', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send(testBooking)
        .expect(401);
    });

    it('should not create booking with invalid times', async () => {
      const invalidBooking = {
        ...testBooking,
        startTime: new Date(Date.now() + 7200000), // 2 hours from now
        endTime: new Date(Date.now() + 3600000) // 1 hour from now
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidBooking)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/bookings', () => {
    beforeEach(async () => {
      await Booking.create({
        ...testBooking,
        user: testUser._id
      });
    });

    it('should get user bookings', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('station');
    });

    it('should get booking by id', async () => {
      const booking = await Booking.findOne({ user: testUser._id });
      
      const response = await request(app)
        .get(`/api/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('station');
      expect(response.body).toHaveProperty('startTime');
    });
  });

  describe('PUT /api/bookings/:id', () => {
    let bookingId;

    beforeEach(async () => {
      const booking = await Booking.create({
        ...testBooking,
        user: testUser._id
      });
      bookingId = booking._id;
    });

    it('should update booking status', async () => {
      const response = await request(app)
        .put(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'cancelled' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'cancelled');
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    let bookingId;

    beforeEach(async () => {
      const booking = await Booking.create({
        ...testBooking,
        user: testUser._id
      });
      bookingId = booking._id;
    });

    it('should delete booking', async () => {
      await request(app)
        .delete(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const booking = await Booking.findById(bookingId);
      expect(booking).toBeNull();
    });
  });
}); 