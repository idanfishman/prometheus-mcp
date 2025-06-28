FROM postgres:17-alpine
RUN apk add --no-cache bash curl
WORKDIR /workloads
COPY *.sql ./
COPY bench.sh ./bench.sh
RUN chmod +x bench.sh
CMD ["./bench.sh"] 