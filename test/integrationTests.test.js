const supertest = require("supertest");
const { expect } = require("chai");
const app = require("../server");
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";

let mongoServer;

describe("Sensor API Integration Tests", () => {
  before(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  after(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
  it("should create a new sensor record and retrieve it", async () => {
    const currentDate = new Date();
    const sensorData = {
      sensor_id: 1,
      date: currentDate,
      temperature: 25,
      humidity: 50,
      wind_speed: 10,
    };

    const postResponse = await supertest(app).post("/sensor").send(sensorData);
    expect(postResponse.status).to.equal(201);

    const getResponse = await supertest(app).get("/sensor?sensor_id=1");
    expect(getResponse.status).to.equal(200);
    expect(getResponse.body).to.be.an("array");
  });

  it("should retrieve sensor data for a specific date range", async () => {
    const startDate = new Date(2022, 0, 1);
    const endDate = new Date(2022, 0, 31);
    const getResponse = await supertest(app).get(
      `/sensor?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    );
    expect(getResponse.status).to.equal(200);
    expect(getResponse.body).to.be.an("array");
  });

  it("should return an error for invalid sensor_id in GET request", async () => {
    const getResponse = await supertest(app).get("/sensor?sensor_id=invalid");
    expect(getResponse.status).to.equal(400);
  });

  it("should return no data for a valid but non-existent sensor_id", async () => {
    const getResponse = await supertest(app).get("/sensor?sensor_id=999");
    expect(getResponse.status).to.equal(200);
    expect(getResponse.body).to.be.an("array").that.is.empty;
  });

  it("should aggregate sensor data based on a specific metric", async () => {
    const metric = "temperature";
    const statistic = "average";
    const getResponse = await supertest(app).get(
      `/sensor?metric=${metric}&statistic=${statistic}`
    );
    expect(getResponse.status).to.equal(200);
  });
  it("should return 404 for non-existent routes", async () => {
    const getResponse = await supertest(app).get("/nonexistent");
    expect(getResponse.status).to.equal(404);
  });
  it("should allow multiple data insertions for the same sensor_id", async () => {
    const sensorData1 = {
      sensor_id: 2,
      date: new Date(),
      temperature: 22,
      humidity: 55,
      wind_speed: 15,
    };
    await supertest(app).post("/sensor").send(sensorData1);

    const sensorData2 = {
      sensor_id: 2,
      date: new Date(),
      temperature: 24,
      humidity: 60,
      wind_speed: 10,
    };
    await supertest(app).post("/sensor").send(sensorData2);

    const getResponse = await supertest(app).get("/sensor?sensor_id=2");
    expect(getResponse.status).to.equal(200);
    expect(getResponse.body).to.be.an("array");
    expect(getResponse.body.length).to.be.greaterThan(1);
  });
});
