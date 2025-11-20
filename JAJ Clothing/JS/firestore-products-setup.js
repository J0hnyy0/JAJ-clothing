const sampleProducts = [
    // TOPS
    {
        id: 'classic-tshirt',
        name: 'Classic T-Shirt',
        price: 599,
        description: 'The ultimate black t-shirt, boldly featuring the "JAJ" logo right in the middle.',
        category: 'tops',
        image: 'clothings/tblack.png',
        images: ['clothings/tblack.png', 'clothings/twhite.png'],
        colors: ['Black', 'White'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        inStock: true,
        featured: true
    },
    {
        id: 'sleeveless-sando',
        name: 'Sleeveless Sando Shirt',
        price: 549,
        description: 'Go for a sleek, athletic look with this black sleeveless shirt, branded with the iconic "JAJ" logo.',
        category: 'tops',
        image: 'clothings/nblack.png',
        images: ['clothings/nblack.png', 'clothings/nwhite.png'],
        colors: ['Black', 'White'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        inStock: true,
        featured: false
    },
    {
        id: 'crop-tshirt',
        name: 'Crop T-Shirt',
        price: 649,
        description: 'A clean-cut black tee with the "JAJ" logo as a sharp accent on the chest.',
        category: 'tops',
        image: 'clothings/tcb.png',
        images: ['clothings/tcb.png', 'clothings/tcw.png'],
        colors: ['Black', 'White'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        inStock: true,
        featured: false
    },
    {
        id: 'long-sleeve',
        name: 'Long-Sleeve',
        price: 799,
        description: 'A long-sleeve tee that makes a statement with the "JAJ" logo on the chest and a dynamic wordmark down both sleeves.',
        category: 'tops',
        image: 'clothings/lblack.png',
        images: ['clothings/lblack.png', 'clothings/lwhite.png'],
        colors: ['Black', 'White'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        inStock: true,
        featured: true
    },

    // HOODIES
    {
        id: 'classic-hoodie',
        name: 'Classic Hoodie',
        price: 1299,
        description: 'A stealthy black pullover hoodie with the iconic "JAJ" logo stamped in crisp white on the chest.',
        category: 'hoodies',
        image: 'clothings/hblack.png',
        images: ['clothings/hblack.png', 'clothings/hwhite.png'],
        colors: ['Black', 'White'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        inStock: true,
        featured: true
    },
    {
        id: 'classic-hoodie-v2',
        name: 'Classic Hoodie v2',
        price: 1399,
        description: 'This pullover hoodie takes it to the next level with the "JAJ" logo on the chest and a bold wordmark racing down both sleeves.',
        category: 'hoodies',
        image: 'clothings/hb1.png',
        images: ['clothings/hb1.png', 'clothings/hw1.png'],
        colors: ['Black', 'White'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        inStock: true,
        featured: false
    },
    {
        id: 'zip-hoodie',
        name: 'Zip Up Hoodie',
        price: 1399,
        description: 'A classic full-zip hoodie, featuring the clean "JAJ" logo on the left chest.',
        category: 'hoodies',
        image: 'clothings/zblack.png',
        images: ['clothings/zblack.png', 'clothings/zwhite.png'],
        colors: ['Black', 'White'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        inStock: true,
        featured: false
    },
    {
        id: 'zip-hoodie-v2',
        name: 'Zip Up Hoodie v2',
        price: 1499,
        description: 'This full-zip hoodie is a statement piece, rocking the "JAJ" logo on the chest with a fierce wordmark on both sleeves.',
        category: 'hoodies',
        image: 'clothings/zb1.png',
        images: ['clothings/zb1.png', 'clothings/zw1.png'],
        colors: ['Black', 'White'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        inStock: true,
        featured: true
    },

    // SHORTS/BOTTOMS
    {
        id: 'classic-shorts',
        name: 'Classic Shorts',
        price: 699,
        description: 'Stay cool in these black athletic shorts, featuring the bold "JAJ" logo on the leg.',
        category: 'shorts',
        image: 'clothings/sblack.png',
        images: ['clothings/sblack.png', 'clothings/swhite.png'],
        colors: ['Black', 'White'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        inStock: true,
        featured: false
    },
    {
        id: 'cargo-shorts',
        name: 'Cargo Shorts',
        price: 899,
        description: 'Black cargo shorts built for action, with the "JAJ" logo adding an unmistakable detail.',
        category: 'shorts',
        image: 'clothings/sb2.png',
        images: ['clothings/sb2.png', 'clothings/sw2.png'],
        colors: ['Black', 'White'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        inStock: true,
        featured: true
    },
    {
        id: 'sweatpants',
        name: 'Sweatpants',
        price: 999,
        description: 'These black sweatpants are all about comfort and street style, with the "JAJ" logo giving them a distinct edge.',
        category: 'shorts',
        image: 'clothings/lb3.png',
        images: ['clothings/lb3.png', 'clothings/lw3.png'],
        colors: ['Black', 'White'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        inStock: true,
        featured: false
    },
    {
        id: 'leggings',
        name: 'Leggings',
        price: 799,
        description: 'These black leggings are designed to move, highlighted by the striking "JAJ" logo on the front.',
        category: 'shorts',
        image: 'clothings/llb4.png',
        images: ['clothings/llb4.png', 'clothings/llw4.png'],
        colors: ['Black', 'White'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        inStock: true,
        featured: false
    },

    // HATS
    {
        id: 'classic-cap',
        name: 'Classic Cap',
        price: 449,
        description: 'The perfect black baseball cap, front and center with a sharp, white "JAJ" logo.',
        category: 'hats',
        image: 'clothings/1hb.png',
        images: ['clothings/1hb.png', 'clothings/1hw.png'],
        colors: ['Black', 'White'],
        sizes: ['One Size'],
        inStock: true,
        featured: true
    },
    {
        id: 'bucket-hat',
        name: 'Bucket Hat',
        price: 499,
        description: 'The ultimate black bucket hat for a laid-back look, marked with a clean "JAJ" logo.',
        category: 'hats',
        image: 'clothings/2hbb.png',
        images: ['clothings/2hbb.png', 'clothings/2hww.png'],
        colors: ['Black', 'White'],
        sizes: ['One Size'],
        inStock: true,
        featured: false
    },
    {
        id: 'beanie-hat',
        name: 'Beanie Hat',
        price: 399,
        description: 'Stay warm in this black knit beanie, featuring the signature "JAJ" logo on the cuff.',
        category: 'hats',
        image: 'clothings/3hb.png',
        images: ['clothings/3hb.png', 'clothings/3hw.png'],
        colors: ['Black', 'White'],
        sizes: ['One Size'],
        inStock: true,
        featured: false
    },
    {
        id: 'mickey-ears-hat',
        name: 'Mickey Ears Hat',
        price: 599,
        description: 'For a fun twist on a classic, this baseball cap has cool mouse ears and the "JAJ" logo on the front.',
        category: 'hats',
        image: 'clothings/4hb.png',
        images: ['clothings/4hb.png', 'clothings/4hw.png'],
        colors: ['Black', 'White'],
        sizes: ['One Size'],
        inStock: true,
        featured: true
    }
];

// Function to upload products to Firestore
async function uploadProductsToFirestore() {
    const db = firebase.firestore();
    const batch = db.batch();

    try {
        console.log('Starting to upload products to Firestore...');
        
        sampleProducts.forEach(product => {
            // Use the product ID as the document ID
            const docRef = db.collection('products').doc(product.id);
            
            // Remove the id from the product data since it will be the document ID
            const { id, ...productData } = product;
            
            // Add timestamp
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            productData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            
            batch.set(docRef, productData);
        });

        await batch.commit();
        console.log('All products uploaded successfully!');
        
        // Verify upload
        const snapshot = await db.collection('products').get();
        console.log(`Verified: ${snapshot.size} products in database`);
        
    } catch (error) {
        console.error('Error uploading products:', error);
    }
}

// Alternative: Add products one by one (useful for testing)
async function addSingleProduct(productData) {
    const db = firebase.firestore();
    
    try {
        const { id, ...product } = productData;
        product.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        product.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        
        await db.collection('products').doc(id).set(product);
        console.log('Product added:', id);
    } catch (error) {
        console.error('Error adding product:', error);
    }
}

// Function to check if products exist
async function checkProducts() {
    const db = firebase.firestore();
    
    try {
        const snapshot = await db.collection('products').get();
        console.log(`Found ${snapshot.size} products in database`);
        
        snapshot.forEach(doc => {
            console.log(`- ${doc.id}: ${doc.data().name}`);
        });
        
        return snapshot.size > 0;
    } catch (error) {
        console.error('Error checking products:', error);
        return false;
    }
}

// Function to update product prices (example of batch update)
async function updateProductPrices() {
    const db = firebase.firestore();
    const batch = db.batch();
    
    try {
        const snapshot = await db.collection('products').get();
        
        snapshot.forEach(doc => {
            const docRef = db.collection('products').doc(doc.id);
            batch.update(docRef, {
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        console.log('Product timestamps updated');
    } catch (error) {
        console.error('Error updating products:', error);
    }
}

// Export functions for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sampleProducts,
        uploadProductsToFirestore,
        addSingleProduct,
        checkProducts,
        updateProductPrices
    };
}

// For browser use, attach to window
if (typeof window !== 'undefined') {
    window.ProductsSetup = {
        sampleProducts,
        uploadProductsToFirestore,
        addSingleProduct,
        checkProducts,
        updateProductPrices
    };
}
