FROM composer:2.8 AS vendor-production
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --no-progress --no-scripts --optimize-autoloader

FROM composer:2.8 AS vendor-test
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-interaction --prefer-dist --no-progress --no-scripts

FROM php:8.4-cli-alpine AS runtime-base
WORKDIR /var/www/html
RUN apk add --no-cache curl libpq oniguruma \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS postgresql-dev oniguruma-dev sqlite-dev \
    && docker-php-ext-install pdo_pgsql pdo_sqlite mbstring \
    && apk del .build-deps
COPY . .
RUN mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

FROM runtime-base AS production
COPY --from=vendor-production /app/vendor ./vendor
EXPOSE 8000
CMD ["sh", "-c", "php artisan migrate --force && php artisan db:seed --force && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]

FROM runtime-base AS test
COPY --from=vendor-test /app/vendor ./vendor
RUN touch .env
CMD ["php", "artisan", "test"]
