import pandas as pd
import numpy as np
import requests
import sys
import time
import datetime
from bs4 import BeautifulSoup
from math import ceil
from random import randint

username = sys.argv[1]
filename = sys.argv[2]

def queryPage(url):
    try:
        print('Querying: {}'.format(url))
        headers = {'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36'}
        req = requests.get(url, headers = headers, timeout = 10)
        status = req.status_code

        if status == requests.codes.ok:
            print('Query Successful (Status Code: {})'.format(status))
            return req

        else:
            print('Query Failed. HTTP Status Code = {}'.format(status))
            return None
    except:
        return None

def scrapeContents(html_doc, camis):
    camisList = []
    dateList = []
    starList = []
    textList = []
    response = []

    soup = BeautifulSoup(html_doc, 'html.parser')

    for d in soup.select('.review-content .biz-rating'):
        dateList.append(d.text.strip())

    for s in soup.select('.review-content .i-stars'):
        starList.append(s['title'][:3])

    for t in soup.select('.review-content p'):
        textList.append(t.text)


    if (len(dateList) > 0) & (len(starList) > 0) & (len(textList) > 0):
        camisList += list(np.repeat(camis, len(textList)))
        for i in range(len(camisList)):
            response.append([camisList[i], dateList[i], starList[i], textList[i]])
        return response

    else:
        print('Error Scraping Content')
        return('Error Scraping Content')



def yelpScrape(camis, url):
    try:
        req = queryPage(url)

        if req:
            html_doc = req.text

            response = scrapeContents(html_doc, camis)
            return response

            time.sleep(1)

        else:
            print('Error: Line 86')
            return None

    except:
        print('Error: Line 90')
        raise
        return None


def getReviews(user, file):

    biz = pd.read_csv(file)

    reviews = pd.DataFrame({'camis': [],
                            'date': [],
                            'stars': [],
                            'text': []})

    for i in range(len(biz)):
            print('Scraping: {} ({}/{})'.format(biz.camis[i], i, len(biz)))
            response = yelpScrape(biz.camis[i], biz.url[i])

            if response:
                if response == 'Error Scraping Content':
                    continue

                else:
                    response = pd.DataFrame(response, columns = ['camis', 'date', 'stars', 'text'])
                    reviews = reviews.append(response)

# only scraping the first page to maximize restaurant coverage
                # if biz.pages[i] > 1:
                #     for j in range(biz.pages[i] - 1):
                #         response = yelpScrape(biz.camis[i], biz.url[i] + '?start={}'.format(j * 20))
                #
                #         if response:
                #             response = pd.DataFrame(response, columns = ['camis', 'date', 'stars', 'text'])
                #             reviews = reviews.append(response)
                #
                #         else:
                #             print('Error occurred')
                #             break
            else:
                print('Error occurred')
                print(response)
                break


    dt = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    biz = biz[biz.camis.isin(reviews.camis.unique()) == False]
    biz.to_csv(filename, index = False)
    reviews.to_csv('reviews/yelp_reviews_{}_{}.csv'.format(user,dt), index = False)

getReviews(username, filename)
