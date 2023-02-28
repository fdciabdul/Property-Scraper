import axios from 'axios'
import cheerio from 'cheerio'

class LamudiParser {
  async getDetails (url) {
    const response = await axios.get(url)

    const body = response.data
    const cookie = response.headers['set-cookie']
    const number = await this.getPhoneNumber(url, cookie)
    const data = {
      id: null,
      title: this.cheerioParser(body, 'div.Title-pdp-title-wrapper > h1'),
      price: this.sPlitter(body, 'price_formatted', ','),
      description: this.sPlitter(
        body,
        '<div class="ViewMore-text-description">',
        '</div>'
      ),
      propertyType: this.sPlitter(body, '"subcategory":', ','),
      currency: this.cheerioParser(
        body,
        'div.Title-pdp-price > span:nth-child(1)'
      ),
      building_size: `${this.sPlitter(body, '"building_size":', ',')}m2`,
      land_size: `${this.sPlitter(body, '"land_size":', ',')}m2`,
      location: [
        {
          city: this.sPlitter(body, '"city":', ','),
          area: this.sPlitter(body, '"area":', ','),
          province: this.sPlitter(body, '"region":', '},')
        }
      ],
      location_lat_log: [
        {
          lat: this.sPlitter(body, '"location_latitude":', ','),
          log: this.sPlitter(body, '"location_longitude":', ',')
        }
      ],
      images: await this.getImages(url),
      details: this.getFacilities(body),
      author: [{
        number: number.number,
        name: this.cheerioParser(
          body,
          '.AgentInfoV2-agentSection:nth-child(2) .AgentInfoV2-agent-name'
        )
      }]

    }
    return data
  }

  async getImages (url) {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const filteredImages = []
    $('img').each((i, el) => {
      const src = $(el).attr('data-src')
      filteredImages.push(src)
    })
    const resimage = []
    for (let i = 0; i < filteredImages.length; i++) {
      const image = filteredImages[i]
      if (typeof image !== 'undefined') {
        if (image.includes('static-id')) {
          resimage.push(image)
        }
      }
    }
    return resimage
  }

  async getSearch (keyword, location, page = 1) {
    const response = await axios.get(
      'https://www.lamudi.co.id/' +
        location +
        '/buy/?q=' +
        keyword +
        '&' +
        `?page=${page}`
    )
    const $ = cheerio.load(response.data)
    const res = []
    $('div.ListingCell-AllInfo.ListingUnit > a').each((i, el) => {
      const src = $(el).attr('title')
      res.push({
        title: src,
        url: $(el).attr('href')
      })
    })
    return res
  }

  async getPhoneNumber (url, cookie) {
    const param = '/request-phone'
    const formdata = {
      doSubmit: '1'
    }
    const response = await axios.post(
      url + param,
      formdata,
      this.headerPhone(cookie)
    )
    return {
      number: response.data.mobilePhone ?? null,
      office_number: response.data.officePhone ?? null
    }
  }

  cheerioParser (body, selector) {
    const $ = cheerio.load(body)
    return $(selector).text().trim()
  }

  getFacilities (body) {
    const $ = cheerio.load(body)

    const attributes = $('div.columns-2')
      .map((_, element) => ({
        name: $(element).children('.ellipsis').attr('data-attr-name'),
        title: $(element).children('.ellipsis')
          .text()
          .trim(),
        last: $(element).children('.last').text().trim()
      }))
      .get()
    return attributes
  }

  sPlitter (string, selector, param) {
    return string
      .split(selector)[1]
      .split(param)[0]
      .replace(/"/g, '')
      .replace(/:/g, '')
      .replace(/\s\s+/g, '')
  }

  headerPhone (cookie = false) {
    return {
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9,id-ID;q=0.8,id;q=0.7,ar;q=0.6',
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'sec-ch-ua':
          '"Chromium";v="110", "Not A(Brand";v="24", "Google Chrome";v="110"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        cookie:
          cookie ??
          'eid=id_1757892021623101; device_view=full; PHPSESSID_lamudi=6f92a79b26f218e76c4497483c5c64b5; userLanguage=in; sid=id_1758751198816122; feature_flags=VariableControl%3A1; feature_sets=Control; last_prefetch_time=1677275850; _recent_searches=["/jakarta/house/buy/","/jakarta/buy/"]; reese84=3:7W1/NvX349VTlGKTQJCIwA==:uMRXnot20YRMTrSJQy6CRGCAA4CuHcHmY+z5yhgNdUz4AKZiFZpx0jPt1WE2bUbzeMu2WsJ0FcL53onXnefwftoyZ8VV1r5FqZOto+d8/SmmWWtfzzLQTTkEEkZQonTHgBzP9xYZ7EHb17/qq5/GMYAjJ2E20I02gWeEbW7/lCXeHs/ESeXe3PxJD1UaniD4NBGmSYMxxkKTYunRzxoeegur/8AjyegRfELFg28nRxM4aL3HSrG2069l8KtEXqn2A/41FdsgSm4FJAO9sUsDfCOGf5q9Tlnl5ueM2mSf9f79Js8iWM9mYmzFngTp3X7LzhNwmGFAurNoMxDA8Qs3eiSCK5+xMOKDVBtkD1uTxmEggqJEZ2dJaz5+fS5EdtzBbPqsmezk9qYAEHxt3Xpp+DTXQAleViWzVALroLo3FBXRSbziMQRFwKMtyLn1GAZJXwhQ1BzGWXkYBZPVq5Ciax64jAVTPBbM8IWPZEHeq8A=:d97ZRh720rmu8lkkF7coCxtZ6S6AaIQV9l6sYkU8o2s=',
        Referer:
          'https://www.lamudi.co.id/dijual-tempat-usaha-hook-di-jalan-cempaka-putih-tengah-jakarta-pusat.html',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      }
    }
  }
}

export default LamudiParser
