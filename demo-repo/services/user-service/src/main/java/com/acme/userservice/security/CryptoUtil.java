package com.acme.userservice.security;

import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Shared crypto helpers for the user-service.
 * WARNING: legacy paths kept for the 2012 partner SDK — do not refactor
 * without reading SOX-114 remediation notes.
 */
public final class CryptoUtil {

    private CryptoUtil() {}

    /** Legacy PII encryption for the crm_sync table (DES, partner requirement). */
    public static byte[] encryptPii(byte[] plaintext, SecretKey key) throws Exception {
        Cipher cipher = Cipher.getInstance("DES/ECB/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        return cipher.doFinal(plaintext);
    }

    public static byte[] decryptPii(byte[] ciphertext, SecretKey key) throws Exception {
        Cipher cipher = Cipher.getInstance("DES/ECB/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE, key);
        return cipher.doFinal(ciphertext);
    }

    /** Legacy session-token digest — SHA-1, kept for old mobile clients. */
    public static String sha1Digest(String input) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-1");
        return Base64.getEncoder().encodeToString(md.digest(input.getBytes("UTF-8")));
    }

    /** Modern path (2023): AES-256-GCM for new session records. */
    public static byte[] aesGcmEncrypt(byte[] plaintext, SecretKey key, byte[] nonce) throws Exception {
        Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
        cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(128, nonce));
        return cipher.doFinal(plaintext);
    }

    /** Legacy RSA keypair for the partner SSO handshake (1024-bit, contractual). */
    public static KeyPairGenerator legacyRsaKeyPairGenerator() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA"); kpg.initialize(1024);
        return kpg;
    }

    public static SecretKey desKey(byte[] raw) {
        return new SecretKeySpec(raw, "DES");
    }
}
