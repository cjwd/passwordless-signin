## Getting Started

__Requirements__
* node
* yarn or npm
* Airtable account (free)
* Mailtrap account (free)

## Usage
__Install Dependencies__

`yarn`

__Set your environment variables__

Change the _example.variables.env_ to  _variables.env_

Set your Airtable API key and Base ID

This demo reqires an Airtable account with a base with a table users with the fields:
* name
* email
* token
* token_date

Set your SMTP info

This demo requires Mailtrap


__Start server and watch files__

`yarn start`

Visit in browser http://localhost:7777. The default port is 7777 but you can change this in your environment variables file (_variables.env_)