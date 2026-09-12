FROM node:22-alpine AS frontend-build

WORKDIR /build/frontend

COPY repurposer-frontend/package*.json ./
RUN npm ci

COPY repurposer-frontend/ ./
RUN npm run build

FROM maven:3.9-eclipse-temurin-22 AS backend-build

WORKDIR /build/backend

COPY repurposer/pom.xml ./
RUN mvn dependency:go-offline -B

COPY repurposer/ ./
COPY --from=frontend-build /build/frontend/dist/ ./src/main/resources/static/
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:22-jre

WORKDIR /app

COPY --from=backend-build /build/backend/target/repurposer-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]