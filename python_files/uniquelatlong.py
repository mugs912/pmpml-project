def findid():
	cnt=0
	l=[]
	fh=open("routes.csv","r")
	fw=open("latlong.csv","w")
	content=fh.read().splitlines()
	for line in content:
		key=''
		if(content.index(line)==0):
			fw.write('Key,Stop Name,Latitude,Longitude\n')
			continue
		stop=line.split(',')
		key=int(stop[5].split('.')[1]+stop[6].split('.')[1])
		lat=float(stop[5])
		lon=float(stop[6])
		if(key in l):
			continue;
		else:
			l.append(key)
			cnt=cnt+1
			fw.write(str(cnt)+','+stop[4]+','+str(lat)+','+str(lon)+'\n')
	print(len(l))
findid()
