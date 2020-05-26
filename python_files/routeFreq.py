import psycopg2
con = psycopg2.connect("dbname=pmpml user=postgres password=91298 host=localhost")
cur = con.cursor()
routes='select r1.route_id, r1.stop_seq as R1Stop, r2.stop_seq as R2Stop from routes r1, routes r2 where r1.route_id=r2.route_id and r1.route_id in(select route_id from routes where r2.stop_id in(select stop_id from stops where stop_name=%s)) and r1.stop_id in(select stop_id from stops where stop_name=%s) and r1.stop_seq > r2.stop_seq'
cur.execute('select distinct stop_name from stops order by stop_name')
stopNames=cur.fetchall()
print(stopNames,end='\n\n')
cnt=0
cntnon0=0
fh=open('route_freq.csv','w')

#for stop in stopNames:
 #   stop[0]=stop[0].strip(' ')

for i in range(0,len(stopNames)):
    for j in range(i+1,len(stopNames)):
        cnt=cnt+1
        cur.execute(routes,(stopNames[i][0],stopNames[j][0]))
        numRoutes=cur.fetchall()
        l=len(numRoutes)
        if(l==0):
            continue
        print(stopNames[i][0],',',stopNames[j][0],',',l)
        fh.write(stopNames[i][0]+','+stopNames[j][0]+','+str(l)+'\n')
        cntnon0=cntnon0+1

fh.close()
print('')
print('cnt=',cnt)
print('cntnon0=',cntnon0)