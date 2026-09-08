CC = gcc
CFLAGS = -O2 -Wall

md5_tool: md5_tool.c
	$(CC) $(CFLAGS) -o md5_tool md5_tool.c -lcrypto

clean:
	rm -f md5_tool

.PHONY: clean
