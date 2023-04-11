# Wallet Listener (For Bitcoin)

## Prerequisites

- Install docker
- install docker compose

# Local Setup

- Clone repo
- Setup the DB
- Do `npm install` in **address-listener** and **update-balance**
- Rename file `sample.env` into `btc.env`
- Fill the missing values in the `btc.env` file
- **RECOMMENDED**: update the CURRENT_BLOCK value (put a resent block value from blockexplorer, otherwise it will start fetching from very old block)
- **TO START** run `docker-compose up -d`

### Connect Services Locally

The mongo db can be connected via **localhost** with port **27017** (can be changed from docker-compose file)

RabbitMQ can be connected locally via **localhost** with port **5674** (can be changed from docker-compose file)

RabbitMQ management UI can be accessed via **localhost: 15674** (can be changed from docker-compose file)

## Prod Setup

- Clone repo
- Setup the DB
- Do `npm install` in **address-listener** and **update-balance**
- Rename file `sample.env` into `btc.env`
- Fill the missing values in the `btc.env` file
- **TO START** run `docker-compose -f docker-compose.prod.yml up -d`
