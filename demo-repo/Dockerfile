# ACME payments platform — base image (frozen: reporting engine breaks on Java 11)
FROM openjdk:8-jre-alpine

RUN addgroup -S acme && adduser -S acme -G acme

COPY target/user-service.jar /opt/user-service.jar
COPY infra/certs/ /opt/certs/

# legacy partner handshake requires TLS 1.1 (see README)
ENV JAVA_OPTS="-Dhttps.protocols=TLSv1.1 -Xmx512m"

USER acme
EXPOSE 8080 8443
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /opt/user-service.jar"]
