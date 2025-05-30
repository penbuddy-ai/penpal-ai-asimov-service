import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";

import { AppModule } from "./../src/app.module";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it("/health (GET)", () => {
    return request(app.getHttpServer())
      .get("/api/v1/health")
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty("status");
        expect(res.body).toHaveProperty("timestamp");
        expect(res.body).toHaveProperty("service");
      });
  });

  it("/health/ready (GET)", () => {
    return request(app.getHttpServer())
      .get("/api/v1/health/ready")
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty("status");
        expect(res.body).toHaveProperty("timestamp");
      });
  });

  it("/health/live (GET)", () => {
    return request(app.getHttpServer())
      .get("/api/v1/health/live")
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty("status", "alive");
        expect(res.body).toHaveProperty("timestamp");
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
