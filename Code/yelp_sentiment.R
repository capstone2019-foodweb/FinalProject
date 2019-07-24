library(tidyverse)
library(quanteda)
library(topicmodels)
library(tidytext)

setwd("C:/Users/adley/Google Drive/School/Capstone/data/")

file <- "yelp_clean.csv"

# Sentiment Scores Using Grouped Reviews ----------------------------------

reviews <- read.csv(file, quote = "", stringsAsFactors = FALSE)
rev_dfm <- read.csv(file, stringsAsFactors = FALSE) %>%
              corpus() %>%
              dfm(remove_punct = TRUE,
                  remove_numbers = TRUE,
                  remove_symbols = TRUE,
                  remove = stopwords("en"))

textplot_wordcloud(rev_dfm, color = '#343434')

senti <- as.dictionary(get_sentiments('nrc'))

senti_dfm <- read.csv(file, stringsAsFactors = FALSE) %>%
                corpus() %>%
                dfm(remove_punct = TRUE,
                   remove_numbers = TRUE,
                   remove_symbols = TRUE,
                   remove = stopwords("en"),
                   dictionary = senti)

senti_dfm@docvars$tokens <- ntoken(senti_dfm)

yelp_senti <- senti_dfm %>% convert('data.frame')

senti_scores <- cbind(senti_dfm@docvars, yelp_senti) %>%
  select(-date, -stars, -document) %>%
  group_by(camis) %>%
  summarise_all(sum)

senti_scores <- senti_scores %>%
  group_by(camis, tokens) %>%
  mutate_all(funs(./tokens)) %>%
  select(-tokens)

# write.csv(senti_scores, 'yelp_sentiments.csv')


# LDA Using Individual Reviews --------------------------------------------


#Load DFMs


flag_dfm <- read.csv(file, stringsAsFactors = FALSE) %>%
  corpus() %>%
  corpus_subset(flag_3 == 1) %>%
  dfm(remove_numbers = TRUE,
      remove_symbols = TRUE,
      remove = stopwords("en"),
      stem = TRUE)

noflag_dfm <- read.csv(file, stringsAsFactors = FALSE) %>%
  corpus() %>%
  corpus_subset(flag_3 == 0) %>%
  dfm(remove_numbers = TRUE,
      remove_symbols = TRUE,
      remove = stopwords("en"),
      stem = TRUE)

pos_dfm <- read.csv(file, stringsAsFactors = FALSE) %>%
            corpus() %>%
            corpus_subset(stars > 3) %>%
            dfm(remove_numbers = TRUE,
                remove_symbols = TRUE,
                remove = stopwords("en"),
                stem = TRUE)

neg_dfm <- read.csv(file, stringsAsFactors = FALSE) %>%
            corpus() %>%
            corpus_subset(stars <= 3) %>%
            dfm(remove_numbers = TRUE,
                remove_symbols = TRUE,
                remove = stopwords("en"),
                stem = TRUE)


#word frequencies
# pos_wfreq <- textstat_frequency(pos_dfm)
# neg_wfreq <- textstat_frequency(neg_dfm)

flag_wfreq <- textstat_frequency(flag_dfm)
noflag_wfreq <- textstat_frequency(noflag_dfm)

#LDA
buildLDA <- function(dfm, k, seed, alpha) {
  model <- LDA(dfm,
                 method = "Gibbs",
                 k = k,
                 iterations = 1000,
                 control = list(seed = seed, alpha = alpha))
  return(model)
  
}

a = 0.2
seed = 1000

flag_lda <- buildLDA(flag_dfm, 5, seed, a)
noflag_lda <- buildLDA(noflag_dfm, 8, seed, a)

pos_lda <- buildLDA(pos_dfm, 10, seed, a)
neg_lda <- buildLDA(neg_dfm, 10, seed, a)



#extract terms
flag_terms <- get_terms(flag_lda, 10)
noflag_terms <- get_terms(noflag_lda, 10)

pos_terms <- get_terms(pos_lda, 10)
neg_terms <- get_terms(neg_lda, 10)

#assign topics to documents
pos_dfm@docvars$topic <- get_topics(pos_lda)
pos_dfm@docvars <- pos_dfm@docvars %>% mutate(topic = str_c("good_", topic))
pos_tops <- pos_dfm@docvars %>%
                group_by(camis) %>%
                count(topic) %>%
                filter(n == max(n))



neg_dfm@docvars$topic <- get_topics(neg_lda)
neg_dfm@docvars <- neg_dfm@docvars %>% mutate(topic = str_c("bad_", topic))
neg_tops <- neg_dfm@docvars %>%
                group_by(camis) %>%
                count(topic) %>%
                filter(n == max(n))

#merge positive and negative topic lists
rev_tops <- rbind(pos_tops, neg_tops) %>% arrange(camis) %>% select(-(n))


# write.csv(pos_terms, "pos_terms.csv")
# write.csv(neg_terms, "neg_terms.csv")
# write.csv(rev_tops, "topics.csv")
