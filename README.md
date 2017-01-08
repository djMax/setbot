set-bot
=======

A Set solving program built in node.js using OpenCV.

![alt text](https://github.com/djmax/setbot/raw/master/tests/sample.jpg "Sample Set Board")

And the bot says...

```
SET!
  2 Solid Green Oval
  1 Blank Purple Oval
  3 Hashed Red Oval
SET!
  1 Blank Purple Tilde
  2 Blank Purple Diamonds
  3 Blank Purple Oval
SET!
  3 Blank Red Diamonds
  3 Solid Red Tilde
  3 Hashed Red Oval
```

Bugs
====
Right now the card registration and rectangularization seems to work
fine. But color and fill are just hand tuned and will never work in
different lighting, etc.

1. This is my first time using OpenCV
2. The Javascript bindings are incomplete and a bit tough to wade through

So what should really happen, IMHO, is a single shape from a card
should be extracted and fed to a trained classifier. Maybe I'll do that
next but if someone has a better idea, please say so in the Issues!
