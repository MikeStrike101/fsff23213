# Weather API

This project is a weather data API built with Node.js, Express, and MongoDB. It allows users to query weather sensor data and supports various endpoints for retrieving and aggregating weather metrics.

## Features

- Retrieve weather data by sensor ID, date range, and specific metrics.
- Aggregation of weather data (e.g., average temperature, humidity).
- RESTful API endpoints for easy integration.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine

### Prerequisites

- Node.js
- MongoDB
- Git (for version control)

### Installing

Clone the repository:

```bash
git clone https://github.com/MikeStrike101/fsff23213.git
npm install
docker compose up --build

Server will start listening on port 3001. Unit tests and integration tests will get executed. To make a GET request for the average temperature and humidity for sensor 1
in a week: http://localhost:3001/sensor?sensor_id=1&startDate=2023-06-01&endDate=2023-06-08&metrics=temperature,humidity&statistic=average

Here is an example of a POST request:

curl -X POST http://localhost:3001/sensor \
     -H "Content-Type: application/json" \
     -d '{
           "sensor_id": 1,
           "date": "2023-04-01T12:00:00.000Z",
           "temperature": 25,
           "humidity": 50,
           "wind_speed": 10
         }'
