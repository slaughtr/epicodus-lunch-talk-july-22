const fetch = require('node-fetch')
const cheerio = require('cheerio')
const AWS = require('aws-sdk')
const dynamoDB = new AWS.DynamoDB.DocumentClient()

exports.handler = async event => {
    const { queryStringParameters } = event
    const { url, selector } = queryStringParameters

    const request = await fetch(url)
    const pageText = await request.text()
    // const pageJson = await request.json()

    const $ = cheerio.load(pageText)

    const price = $(selector).html()
    console.log(price)
    // $420 - bad
    // 420 - good
    const priceRegex = /(\d)+/ // only match digits
    const cleanPrice = price.match(priceRegex)[0]
    console.log(cleanPrice)
    console.log(+cleanPrice)

    const ddbParams = {
        TableName: 'priceCheck',
        Key: { url: url },
        UpdateExpression: 'SET selector = :sel, price = :pri',
        ExpressionAttributeValues: {
            ':sel': selector,
            ':pri': +cleanPrice
        }
    };
    
    await dynamoDB.update(ddbParams).promise()

    return {
        statusCode: 200,
        body: cleanPrice
    }
}