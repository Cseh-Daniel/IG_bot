//including http basic module to create UI
const http=require("http");
const url=require("url");
const qs=require("querystring");

//including puppeteer "web browser manipulator"
const puppeteer = require("puppeteer");

//with this you can communicate with stdin and stdout
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

const fs = require("fs"); //including FileStream so we can read and write files
const { Console } = require("console");

const PORT=8080; 

fs.readFile("./index.html",(err,html)=>{

  if(err){throw err}

  http.createServer(function(req, res) { 
  let body='';

  res.writeHeader(200, {"Content-Type": "text/html"});  
  res.write(html);  
  res.end();
  
  if(req.method === 'POST')
  {
  
  req.on("data",data=>{
    body+=data;
  });
  
  req.on("end",()=>{
    var post = qs.parse(body);
    console.log(post);

  });
  
  }
  }).listen(PORT);
});



console.log("Server started on "+PORT);







async function main() {
  //reading the given hashtags

  let tags = ""; //declaring the variable that will store the values stored in "Tags.txt"
  let err;

  //try catch for reading Tags.txt
  //if error it gives a message with a short manual
  try {
    tags = fs.readFileSync("Tags.txt", "utf-8").split("\r\n"); //reading Tags.txt and splitting the string at enters

    //console.log(tags);//writing out the content of tags variable for debugging purposes.
  } catch (err) {
    //error message
    console.error(
      "---------------\r\nError Arose\r\n" +
        err +
        "\r\n---------------\r\nCheck the file name.\nIt should be called exactly like 'Tags.txt' with capital T and placed in the root folder."
    );
  }

  /*-------------------------------------------------------------------
   *starting the manipulated browser
   */
  console.log("The given hashtags:\n" + tags);
  const browser = await puppeteer.launch({ headless: false, slowMo: 75 });

  const page = await browser.newPage();
  await page.goto("https://www.instagram.com/");

  try {
    await page.waitForNetworkIdle();
  } catch (err) {
    console.log(err + "\nProblem while loading the login page!");
  }
  //buttons=await page.$$("button");

  //buttons= await page.$$eval("button",el=>{console.log(el);});
  buttons = await page.$$("button");
  //console.log(buttons);
  let element;

  for (i in buttons) {
    let text = await page.evaluate((el) => el.textContent, buttons[i]);
    if (text.includes("Csak a") || text.includes("Only allow")) {
      element = buttons[i];
      console.log("megtaláltam!");
    }
  }

  try {
    await element.click();
  } catch (e) {
    console.log(e + "\nCookie error");
    return -1;

    //process.exit(-1);
  }

  //wait for popup window to disappear and login inputs get visible
  await page.waitForTimeout(2500);
  let bool2step;
  let uname;
  let pword;

  /**
   * -------------
   * -IF ELSE- FOR 2 STEP AUTH WHETHER IT IS ENABLED OR NOT
   * -------------
   */

  do {
    bool2step = await new Promise((el) => {
      readline.question("Is 2-step authentication enabled?(Y/N):", el);
    });
  } while (
    bool2step != "Y" &&
    bool2step != "N" &&
    bool2step != "y" &&
    bool2step != "n"
  );

  bool2step = bool2step === "Y" || bool2step === "y" ? true : false;
  //console.log("bool: "+bool2step);

  uname = await new Promise((el) => {
    readline.question("Your E-mail/username please:", el);
  });

  do {
    pword = await new Promise((el) => {
      readline.question("Your password please:", el);
    });
  } while (pword.length < 6);

  console.log("Your pw starts with " + pword.substring(0, 2));

  let elements = await page.$$("input[name=username]");
  //console.log(elements);
  await elements[0].type(uname);

  elements = await page.$$("input[name=password]");
  //console.log(elements);
  await elements[0].type(pword);

  elements = [];
  elements = await page.$$("button[type=submit]");

  await elements[0].click();

  await page.waitForTimeout(1000);
  elements = [];
  error = await page.$$("p[data-testid=login-error-message]");
  /**
   * in case of wrong login credentials
   *
   */
  if (error.length == 1) {
    console.log("----\nWrong login details!\nPlease restart the bot!\n----");
    return -2;
  }

  /*
After click wait for page loading in otherwise the input field for 2step auth wouldn't be found.
*/
  //await page.waitForNavigation({waitUntil: 'networkidle2'});
  try {
    await page.waitForNetworkIdle();
  } catch (err) {
    console.log(err);
  }

  if (bool2step) {
    elements = await page.$$("input[name=verificationCode]");

    authCode = await new Promise((el) => {
      readline.question("Your 2-step verification code:", el);
    });

    await elements[0].type(authCode);
    elements = await page.$$("button[type=button]");
    await elements[0].click();
  }
  console.log("\nStart network idle wait seconds----\n");
  //await page.waitForTimeout(2500);
  //await page.waitForNavigation({waitUntil: 'networkidle2'});

  try {
    await page.waitForNetworkIdle();
  } catch (err) {
    console.log(err);
  }

  console.log("\nEnd network idle wait seconds----\n");

  //pressing don't save login credentials
  elements = await page.$$("button");
  console.log("elements:\n" + elements.length + "\n\n");
  //await elements[0].click();

  for (i in elements) {
    let text = await page.evaluate((el) => el.textContent, elements[i]);
    //console.log("\n"+text+"\n");
    if (text.includes("Most nem") || text.includes("Not Now")) {
      element = elements[i];
      console.log("megtaláltam! auth data");
    }
  }
  console.log("\nclick1");
  await element.click();
  console.log("\nclick2");

  await page.waitForTimeout(2500);

  //pressing no for notifications
  elements = await page.$$("button");

  for (i in elements) {
    let text = await page.evaluate((el) => el.textContent, elements[i]);
    //console.log("\n"+text+"\n");
    if (text.includes("Most nem") || text.includes("Not Now")) {
      element = elements[i];
      console.log("megtaláltam! notify");
    }
  }

  await element.click();
  await page.waitForTimeout(2500);
  console.log("Logged in");
  /**
   *
   * from this point we are logged in
   *
   */

  //elements=await page.$$("[aria-label='Keresett szöveg']");

  /**
   * locating searchbar and utilizing it
   */

  //let sb; //SearchBar
  //sb=await page.$$("input[placeholder=Search]");
  //console.log("elements:\n"+sb+"\n"+sb.length);
  //await sb[0].type(tags[0]);
  //await page.keyboard.press('Enter');
  //await page.keyboard.press('Enter');

  /**
   * Searchbar end
   */

  /**
   * using links instead of SearchBar for hashtags
   * https://www.instagram.com/explore/tags/?tag?/
   *
   * eg:https://www.instagram.com/explore/tags/kingdomhearts/
   */

  let tag;
  let url = "https://www.instagram.com/explore/tags/";
  url = url.concat(tags[0].slice(1), "/");
  console.log(url);
  await page.goto(url);

  //await page.waitForTimeout(2500);

  //await page.waitForNetworkIdle(/*{idleTime:1500}*/);//?? iz det gúd

  try {
    await page.waitForTimeout(5000);
    //await page.waitForNetworkIdle();
    //await page.waitForNetworkIdle({idleTime:1500});
    //await page.waitForNavigation({waitUntil: 'networkidle2'});
  } catch (err) {
    //console.log(err+"\n\nError While waiting after "+url);
    console.log("");
  }

  await page.waitForTimeout(1000);
  //page.scrollBy(0,page.innerHeight);
  page.evaluate((_) => {
    window.scrollBy(0, window.innerHeight * 10);
  });
  await page.waitForTimeout(10000);
  let posts = await page.$$("a");
  console.log("\tFound posts:" + posts.length);
  let goodLinks = [];
  for (i in posts) {
    let link = await page.evaluate((el) => el.href, posts[i]);
    //console.log("\n"+link);
    if (link.includes("/p/")) {
      goodLinks.push(link);
    }
  }
  console.log("Content of goodLinks:\n");
  console.log(goodLinks);

  //dropping first 9 links cuz they are the popular ones and usually they are the same 9, and not changing a for a long while

  for (i = 0; i < 9; i++) {
    goodLinks.shift();
  }

  //for(i in goodLinks){

  await page.goto(goodLinks[0]);
  await page.waitForTimeout(4000);
  console.log("looking for Like button");

  buttons = await page.$$("button");

  /*megtaláljuk a Tetszik szöveget, de nem kattintható mert az svg van elmentve nekünk a gomb kellene valahogy
            ha kikérjük az összes gombot és a benne levő tartalmat ellenőrizzük le talén működhet
            await page.$eval('button', e => e.innerHTML)
        */

  //let like = await page.$eval("button > div > svg",el=>el.getAttribute('aria-label'));
  //console.log(like.length);
  //console.log(likes);

  let like = [];
  //like.push(99999);
  for (i in buttons) {
    let j = await page.evaluate((el) => el.innerHTML, buttons[i]);
    //like=(j.includes('aria-label="Tetszik"')) ? like.push(i):like;

    if (j.includes('aria-label="Tetszik"')) {
      like.push(i);
      console.log("pushed to like:" + i);
    }

    console.log(
      j.includes('aria-label="Tetszik"') ? i + " Tetszik" : "Nem talált"
    );
    //console.log(j+"\n"+i);
  }
  console.log("like tartalma:\n" + like);
  try {
    await buttons[like[0]].click();
  } catch (err) {
    console.log(err);
  }

  //}

  /**
   * end of main
   **/
}

//main();
