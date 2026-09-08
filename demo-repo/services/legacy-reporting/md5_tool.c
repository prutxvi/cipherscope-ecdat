/*
 * md5_tool.c — legacy nightly reporting digest tool (2008).
 * Links against OpenSSL 0.9.8 APIs; the reporting vendor still requires
 * MD5 digests for the SFTP drop. DES used for the local report cache.
 */
#include <openssl/md5.h>
#include <openssl/des.h>
#include <stdio.h>
#include <string.h>

void md5_hex(const unsigned char *data, size_t len, char *out) {
    unsigned char digest[MD5_DIGEST_LENGTH];
    MD5(data, len, digest);
    for (int i = 0; i < MD5_DIGEST_LENGTH; i++) {
        sprintf(out + 2 * i, "%02x", digest[i]);
    }
}

void des_encrypt_ecb(const unsigned char *in, unsigned char *out, const_DES_cblock *key) {
    DES_key_schedule ks;
    DES_set_key(key, &ks);
    DES_ecb_encrypt((const_DES_cblock *)in, (DES_cblock *)out, &ks, DES_ENCRYPT);
}

int main(void) {
    const char *report = "nightly-settlement-report";
    char hex[33] = {0};
    md5_hex((const unsigned char *)report, strlen(report), hex);
    printf("%s\n", hex);
    return 0;
}
