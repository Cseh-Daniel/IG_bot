//including basic modules to create UI
const http=require("http");
//const url=require("url");
const qs=require("querystring");
const events = require("events");
var em = new events.EventEmitter();


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

class User{

  constructor(username,passw){
    this.userName=username;
    this.passw=passw;
    this.verifCode=null;
    this.verifBool=null;
    this.links=[];
  }

  get posts(){

    return this.links;

  }

  set posts(data){
    this.links=data;
  }

  get name(){
    return this.userName;
  }

  set name(name){
    this.userName=name;
  }

  get pwrd(){
    return this.passw;
  }

  set pwrd(passw){
    this.passw=passw;
  }

  get verifcode(){
    return this.verifCode;
  }

  set verifcode(code){

    this.verifCode=code;

  }

  get verifbool(){
    return this.verifBool;
  }

  set verifbool(bool){

    this.verifBool=bool;

  }

   toString(){
      return "User data: "+this.userName+" | "+this.passw+" | "+this.verifCode+" | "+this.verifBool;
    }

}

myUser=new User("","");

console.log(myUser.toString());

  http.createServer(function(req, res) { 
  let body='';
  if(req.method==='GET'){
    if(req.url=='/'){ 
    res.writeHeader(200, {"Content-Type": "text/html"});  
    console.log("form");
   res.write(fs.readFileSync("./index.html","utf-8"));
    res.end();
  }else if(req.url=='/verifCode'){
      res.writeHeader(200, {"Content-Type": "text/html"});  
      //res.write();  
      console.log("verif");
      res.write(fs.readFileSync("./verif.html","utf-8"));
      res.end();
    }else if(req.url=='/likedLinks'){
      /*
          az összes link kiíratását inkább tegyük csak txt-be
          vagy csak annyit írjunk ki h éppen melyik hashtag linkjeinél járunk
      */

      let cssInclude='<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">';
      let scriptInclude='<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>';

      let content="<html><head><title>Links</title>"+cssInclude+"</head><body>"+scriptInclude+"<table class='table table-striped'>"
      for (i in myUser.posts){
  
        content+="<tr><td><a href='"+myUser.posts[i]+"'target='_blank'>"+myUser.posts[i]+"</a></td></tr>";
      }
      content+="</table></body></html>";
      //console.log(content);
      res.write(content);
      res.end();

    }
  
  }
 

  em.on("verifNeeded",()=>{
    console.log("\nVerif\tNeeded\n");
    res.writeHeader(302, {'Location': '/verifCode'});
    //res.write(fs.readFileSync("./verif.html","utf-8"));
    res.end();

  });

/*
  em.once("likedLinks",(data)=>{
    console.log("Links arrieved");
    //console.log(data);
    res.writeHeader(302, {'Location': '/likedLinks'});

    myUser.posts=data;

    res.end();
  });
*/

  if(req.method === 'POST')
  {
  
      req.on("data",data=>{
        body+=data;
      });
      
      req.on("end",()=>{

          var post = qs.parse(body);
          if(req.url=="/"){

          myUser.name=post["email"];
          myUser.pwrd=post["pword"];
          myUser.verifbool=post["verifi"];
          console.log(String(myUser));
          liker(myUser.name,myUser.pwrd, myUser.verifBool);

        }else if(req.url=="/verifCode"){

            myUser.verifCode=post["verifCode"];
            //console.log(myUser.name+" - "+myUser.verifcode);
            console.log(String(myUser));
            //res.end();
            //em.emit("verifSuccess","Verification code successfully given!");
          }


      });
      

  }
  }).listen(PORT);


console.log("Server started on "+PORT);



async function liker(uname,pword,bool2step) {
  //reading the given hashtags
  let tags = ""; //declaring the variable that will store the values stored in "Tags.txt"
  let err;



  //try catch for reading Tags.txt
  //if error it gives a message with a short manual
  try {
    tags = fs.readFileSync("Tags.txt", "utf-8").split("\r\n"); //reading Tags.txt and splitting the string at enters

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

  buttons = await page.$$("button");
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


  }

  //wait for popup window to disappear and login inputs get visible
  await page.waitForTimeout(2500);

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

      /*authCode = await new Promise((el) => {
        readline.question("Your 2-step verification code:", el);
      });*/

       em.emit("verifNeeded");
      
      while(myUser.verifcode==null){
        await page.waitForTimeout(2000);
        console.log("2 sec passed!");
      }

        await elements[0].type(myUser.verifcode);
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

  /**
   * using links instead of SearchBar for hashtags
   * https://www.instagram.com/explore/tags/?tag?/
   *
   * eg:https://www.instagram.com/explore/tags/kingdomhearts/
   */

  let baseUrl = "https://www.instagram.com/explore/tags/";
  let pages=[];


  for(i in tags){
    pages.push(baseUrl.concat(tags[i].slice(1), "/"));
  }


  console.log(pages);

for(pi in pages){
  

      //await page.goto(pages[0]);
      await page.goto(pages[pi]);

      try {
        await page.waitForTimeout(5000);
        
        //await page.waitForNetworkIdle();
        //await page.waitForNetworkIdle({idleTime:1500});
        //await page.waitForNavigation({waitUntil: 'networkidle2'});
      
      } catch (err) {
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


      //em.emit("likedLinks",goodLinks);

      for(i in goodLinks){

          await page.goto(goodLinks[i]);
          //await page.goto(goodLinks[0]);

          await page.waitForTimeout(2000);
          console.log("looking for Like button");

          buttons = await page.$$("button");

          let like = [];
          
          for (i in buttons) {
            let j = await page.evaluate((el) => el.innerHTML, buttons[i]);
            
            if (j.includes('aria-label="Tetszik"')) {
              like.push(i);
              
            }
          }
          try {
            await buttons[like[0]].click();
          } catch (err) {
            console.log(err);
          }

      }
    }
  /**
   * end of liker
   **/
}
