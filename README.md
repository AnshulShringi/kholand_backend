# future-backend-node

## Fetch all code with submodules
```
git submodule init
git submodule update --recursive --remote
```

### Sync contract
```
yarn sync-contracts
```

### Create and Run Migrations
```
yarn typeorm:cli -- migration:create -n KhoKho
yarn typeorm:cli -- migration:run
```

### Add env variables
* Create a directory `env`in the root of porject
* Add the following environment files in the `env` directory
    * development.env
    * production.env
    * staging.env
    
* Add the values for the following environment variables

```
NODE_ENV=development

#Server
PORT=8888
HOST=localhost
BASE_URL=http://0.0.0.0:8888/v1

#Database
DATABASE_URL=postgres://demouser:demopassword@localhost:5432/demodbname
JWT_SECRET=somesecret

INFURA_ADDRESS=https://ropsten.infura.io/v3/190beb160dc545d895eacd9550b2516e
FUTURE_TOKEN_ADDRESS=0xFA77C6acF8953441C205A9a4142F37A8dC1BB118

SENDGRID_API_KEY=<send_grid_api_key>
```

### Start a Postgres server
```
docker run -e POSTGRES_PASSWORD=demopassword -e POSTGRES_USER=demouser -e POSTGRES_DB=demodbname -v $HOME/pgdata:/var/lib/postgresql/data -p 5432:5432 postgres:14.1-alpine
```


## Deployment
Current deployment is set for Heroku. Git submodules is not supported in Heroku, so we deploy via Docker.
Before deployment, make sure submodule is properly loaded.


Log into heroku container registry
```
docker login --username=_ --password=$(heroku auth:token) registry.heroku.com
```
Push docker image to heroku
```
heroku container:push web
```
Deploy the changes
```
heroku container:release web
```

## Endpoints
### Users - get list
```
curl --location --request GET 'http://127.0.0.1:8888/v1/users'
```

### Users - register/create
```
curl --location --request POST 'http://127.0.0.1:8888/v1/users' \
--header 'Content-Type: application/json' \
--data-raw '{
    "publicAddress":"0x12345678",
    "email": "test@gmail.com"

}'
```



