const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Station = require('../models/Station');
const User = require('../models/User');

let mongoServer;
let app;
let authToken;
let adminUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  
  app = require('../server');

  // Create admin user for testing
  adminUser = await User.create({
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  });

  // Get auth token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@test.com',
      password: 'admin123'
    });
  
  authToken = loginResponse.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Station.deleteMany({});
});

describe('Stations API', () => {
  const testStation = {
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
  };

  describe('POST /api/stations', () => {
    it('should create a new station', async () => {
      const response = await request(app)
        .post('/api/stations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testStation)
        .expect(201);

      expect(response.body).toHaveProperty('name', testStation.name);
      expect(response.body.chargingPoints).toHaveLength(1);
    });

    it('should not create station without auth', async () => {
      const response = await request(app)
        .post('/api/stations')
        .send(testStation)
        .expect(401);
    });
  });

  describe('GET /api/stations', () => {
    beforeEach(async () => {
      await Station.create(testStation);
    });

    it('should get all stations', async () => {
      const response = await request(app)
        .get('/api/stations')
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('name', testStation.name);
    });

    it('should get station by id', async () => {
      const station = await Station.findOne({ name: testStation.name });
      
      const response = await request(app)
        .get(`/api/stations/${station._id}`)
        .expect(200);

      expect(response.body).toHaveProperty('name', testStation.name);
    });
  });

  describe('PUT /api/stations/:id', () => {
    let stationId;

    beforeEach(async () => {
      const station = await Station.create(testStation);
      stationId = station._id;
    });

    it('should update station', async () => {
      const updateData = {
        name: 'Updated Station Name'
      };

      const response = await request(app)
        .put(`/api/stations/${stationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', updateData.name);
    });
  });

  describe('DELETE /api/stations/:id', () => {
    let stationId;

    beforeEach(async () => {
      const station = await Station.create(testStation);
      stationId = station._id;
    });

    it('should delete station', async () => {
      await request(app)
        .delete(`/api/stations/${stationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const station = await Station.findById(stationId);
      expect(station).toBeNull();
    });
  });
}); 