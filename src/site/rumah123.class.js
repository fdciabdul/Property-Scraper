import axios from "axios";
import cheerio from "cheerio";

class Rumah123Parser {

  async getDetails(url) {
    const response = await axios.get(url);
    const body = response.data;
    const data = {
      id: "",
      title: this.title(body),
      price: this.price(body).price,
      description: this.description(body),
      propertyType: this.propertyType(body),
      currency: this.price(body).currency,
      building_size: this.building_size(body),
      land_size: this.land_size(body),
      location: [
        {
          city: this.sPlitter(
            body,
            '"addressLocality":"',
            '","addressRegion'
          ).split(",")[1],
          area: this.sPlitter(
            body,
            '"addressLocality":"',
            '","addressRegion'
          ).split(",")[0],
          province: this.sPlitter(body, '"addressRegion":"', '","'),
        },
      ],
      location_lat_log: [
        {
          lat: this.sPlitter(body,'"latitude":',',"'),
          log: this.sPlitter(body,'"longitude":','},"'),
        },
      ],
      images: this.images(body),
      details: this.details(body),
      author: [{ number: this.sPlitter(body,'"phoneNumbers":["','"]'), name: this.sPlitter(body,'"agentName":"','","') }],
    };
   return data;
  }
  title(body) {
    const $ = cheerio.load(body);
    const str = $(
      "#property-summary > div > div.r123-listing-summary__header > div > div.r123-listing-summary__header-container-title > h1"
    ).text();
    return str;
  }
  description(body) {
    const $ = cheerio.load(body);
    return $("div.ui-atomic-text p","div.ui-atomic-text br")
      .map((_, element) => $(element).text())
      .get();
  }
  price(body) {
    const $ = cheerio.load(body);
    const str = $(
      "#property-summary > div > div.r123-listing-summary__price > span"
    ).text();
    const value = parseFloat(str.replace(/[^\d.,]/g, "").replace(",", "."));
    const multiplier = str.includes("Miliar") ? 1000000000 : 1000000;
    const priceInIDR = value * multiplier;

    return {
      price: str.split(" ")[0] + " " + priceInIDR.toLocaleString("id-ID"),
      currency: str.split(" ")[0],
    };
  }
  propertyType(body) {
    const $ = cheerio.load(body);
    const lastSpan = $("#breadcrumb span:last-child");
    return lastSpan.text();
  }
  building_size(body) {
    const $ = cheerio.load(body);
    const spec = $(
      'div.ui-listing-specification__badge:contains("L. Bangunan")'
    )
      .find("p.ui-listing-specification__badge--value")
      .text()
      .trim();
    return spec;
  }
  land_size(body) {
    const $ = cheerio.load(body);
    const spec = $('div.ui-listing-specification__badge:contains("L. Tanah")')
      .find("p.ui-listing-specification__badge--value")
      .text()
      .trim();
    return spec;
  }
  images(body) {
    let data = this.sPlitter(
      body,
      'image":["',
      '"],"'
    ).replace(/https/g, "https:");
    return data.split(",");
  }
  details(body) {
    const $ = cheerio.load(body);

    const facilities = $('span.ui-facilities-portal__text').map(function() {
      return $(this).text().trim(); // return the trimmed text content of each element
    }).get();
    return facilities;
  }
  name(body){
    const $ = cheerio.load(body);

    const name = $('a.ui-organism-listing-inquiry-r123__wrapper-agent div p').text().trim(); // return the trimmed text content of each element

    return name;
  }
  sPlitter(string, selector, param) {
    return string
      .split(selector)[1]
      .split(param)[0]
      .replace(/"/g, "")
      .replace(/:/g, "")
      .replace(/\s\s+/g, "");
  }
  
  async getSearch(keyword, page = 1) {
    const response = await axios.get(
      "https://www.rumah123.com/jual/cari/?q=" + keyword + `?page=${page}`
    );
    const $ = cheerio.load(response.data);
    const res = [];
    $(".ui-organism-intersection__element .card-featured__middle-section > a").each(
      (i, el) => {
        const src = $(el).attr("title");
        const url = "https://www.rumah123.com" + $(el).attr("href");
        if (src && url) {
          res.push({ title: src, url });
        }
      }
    );
    return res;
  }
}

export default Rumah123Parser;