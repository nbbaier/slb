# Initial scraping process

-  Generate a list of pages to visit
-  For each page
   -  Visit the page, get html
   -  Extract the rows
      -  For each row
         -  Get the paper metadata
         -  Visit the paper's page
            -  get the html for the page
            -  get the data on that page
         -  Visit each author's page
            -  get the author's metadata
         -  Write collected data to db

# Runs after the initial scraping run

-  Generate list of ids to visit
-  Use that number in a call to `generateUrls()`
-  Do the above process for each url

# How many fetches am I making per page

1. Fetch page HTML
2. Parse the document in an array of articles (does not count as a fetch)
3. Filter array to only include papers that are not in the db
4. For each article
   1. For each author, check if they are in the db
      1. If not, fetch the author's page HTML
      2. Parse the document
      3. Extract the author's data
      4. Construct author inserts, write to db
   2. Fetch the paper's page HTML
      1. Parse the document
      2. Extract the paper's data
      3. Construct paper inserts, write to db
   3. Construct author-paper relation inserts, write to db
   4. Construct keyword-paper relation inserts, write to db
