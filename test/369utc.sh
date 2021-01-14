
#!/bin/sh -xe

# test case for https://github.com/Stuk/jszip/issues/369

rm -f example.zip Hello.txt
export  TZ=PST5PDT
node  369utc.js #creates exmaple.zip 
unzip example.zip
echo mod time 
ls -l --full-time Hello.txt
echo create time
ls -cl --full-time Hello.txt
moddatestring=`ls -l --full-time Hello.txt | awk '// {print $6, $7 , $8}' `
echo $moddatestring
modseconds=`date --date="${moddatestring}" +"%s"`
echo mod seconds $modseconds
nowseconds=` date +"%s"`
echo now  $nowseconds

if [ $modseconds -gt $nowseconds ]; then
  echo error - time travel is not possible - file is from the future
fi


