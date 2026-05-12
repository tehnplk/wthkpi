# KPI Report System
## important issue
  - on windows Always Convert terminal Console to UTF-8 before begin writing code.
  - on linux use chcp 65001 to covert terminal to utf-8

## Tech Stack
  - Nextjs last version
  - Mariadb on docker containner
  - Knexjs query builder

 ## Terminal Tool
  - `db-cli --skill` for manipulate database
  - Also `docker cli`
  - Read database credential from .env.local

## Document Research Tool
  - `npx ctx7 --help`  CLI

## Test tool
  - start dev server using `bun dev`
  - use `playwright-cli skill`
  - access test url `http://localhost:3000` not `http://127.0.0.1:3000`
  - when start test  you have to call cmd `playwright-cli show`
  - when user ask to anotae you have to call cmd `playwright-cli --annotate`
  - Testing artifacts have to be placed in directory `.playwright-cli`
  - only run and test on port 3000 if port already in use `npx kill-port 3000` then run port 3000 again
 
## Testing / Build / Run
  - Don't do this if user not ask.

## Deployment
  - Don't do this if user not ask.
  - deploy using  github
  - read @docs/production.md

  


