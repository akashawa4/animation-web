// Firebase service functions
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { storage, db } from "./firebase-config.js";

// Upload image to Firebase Storage
export async function uploadImage(imageDataUrl, userName) {
  try {
    // Create a unique filename
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileName = `invento2k25_${timestamp}_${randomString}.jpg`;
    
    // Create a reference to the file location
    const storageRef = ref(storage, `images/${fileName}`);
    
    // Convert data URL to blob format for upload
    const imageData = imageDataUrl.split(',')[1];
    
    // Upload the image
    await uploadString(storageRef, imageData, 'base64');
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Store metadata in Firestore
    const docRef = await addDoc(collection(db, "photos"), {
      fileName: fileName,
      userName: userName || "Anonymous",
      downloadURL: downloadURL,
      timestamp: serverTimestamp(),
      event: "INVENTO 2K25"
    });
    
    console.log("Image uploaded successfully with ID:", docRef.id);
    
    return {
      success: true,
      downloadURL: downloadURL,
      id: docRef.id
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get shareable link for an image
export function getShareableLink(downloadURL) {
  // You could create a short link or just return the download URL
  return downloadURL;
}