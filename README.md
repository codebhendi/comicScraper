# comicScraper
A manga/comic scraper written in javascript

#Tools used for scraper
**Express** is used for creating routes to accept request from the chrome extesnion.  
**Request** is used to scrape the web page and get the images from them.  
**FS** is used to store the images and for creating directories where you will store them.  
**Cheerio** is for the purpose of selecting all the data from the page you want to scrape or in this case to get all the images which I want to save.  
**Forever** is used to keep the server running in the background so that even if you close the terminal it will keep the server up for you.  
**Morgan** just to log all the requests coming to the server.  

#Tools used for Extension
**Chrome extension API** is used for getting the current tab url.  
**Regex** is used to confirm the url is of a manga issue and to extract the website, issue number and manga or comic title. AJAX is used to send the request to the server.  

#How to use
##Install the chrome extension  
1. Open chrome menu.  
2. Click on more tools and the on extensions.  
3. Click on load unpacked extensions and select the extension folder.  

##Install the server  
1. You should have node and npm installed.  
2. Go into the project directory.  
3. Open you shell,terminal or whatever and type  
```npm install```.   
This will install all the required modules.  
4. If you want to keep this server running forever then you have to install forever.js. For that type in your terminal   
```npm install -g forever```.  
5. If you have forever installed then type   
```forever start server.js```.  
6. If not then type node   
```server.js```.  

#Use the extension  
Just open the page of any comic or manga issue page(that means the issue of current manga or comic you are reading). 
Then just click on the extension and the files will be saved in the project directory.  

#Current support
The extension currently supports only two websites. T
hey are readcomics.tv and mangapanda.com. 
Further crawlers will be created.  
