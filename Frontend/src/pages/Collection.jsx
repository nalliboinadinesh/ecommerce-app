// import React, { useContext, useEffect, useState } from 'react';
// import { ShopContext } from '../context/ShopContext';
// import { assets } from '../assets/assets';
// import Title from '../components/Title';
// import ProductItem from '../components/ProductItem';

// const Collection = () => {
//   const { products, search, showSearch } = useContext(ShopContext);

//   const [showFilter, setShowFilter] = useState(false);
//   const [filterProducts, setFilterProducts] = useState([]);
//   const [category, setCategory] = useState([]);
//   const [subcategory, setSubCategory] = useState([]);
//   const [sortType, setSortType] = useState('relavent');

//   const toggleCategory = (e) => {
//     if (category.includes(e.target.value)) {
//       setCategory(prev => prev.filter(item => item !== e.target.value));
//     } else {
//       setCategory(prev => [...prev, e.target.value]);
//     }
//   };

//   const toggleSubCategory = (e) => {
//     if (subcategory.includes(e.target.value)) {
//       setSubCategory(prev => prev.filter(item => item !== e.target.value));
//     } else {
//       setSubCategory(prev => [...prev, e.target.value]);
//     }
//   };

//   const applyFilter = () => {
//     let productsCopy = [...products];

//     if (showSearch && search) {
//       productsCopy = productsCopy.filter(item =>
//         item.name.toLowerCase().includes(search.toLowerCase())
//       );
//     }

//     if (category.length > 0) {
//       productsCopy = productsCopy.filter(item =>
//         category.includes(item.category)
//       );
//     }

//     if (subcategory.length > 0) {
//       productsCopy = productsCopy.filter(item =>
//         subcategory.includes(item.subCategory)
//       );
//     }

//     switch (sortType) {
//       case 'low-high':
//         productsCopy.sort((a, b) => a.price - b.price);
//         break;

//       case 'high-low':
//         productsCopy.sort((a, b) => b.price - a.price);
//         break;

//       default:
//         break;
//     }

//     setFilterProducts(productsCopy);
//   };

//   useEffect(() => {
//     applyFilter();
//   }, [products, search, showSearch, category, subcategory, sortType]);

//   return (
//     <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">

//       <div className="min-w-60">

//         <p
//           onClick={() => setShowFilter(prev => !prev)}
//           className="my-2 text-xl flex items-center cursor-pointer gap-2"
//         >
//           FILTERS
//           <img
//             className={`h-3 sm:hidden transition-transform duration-300 ${
//               showFilter ? 'rotate-90' : ''
//             }`}
//             src={assets.dropdown_icon}
//             alt=""
//           />
//         </p>

//         <div
//           className={`border border-gray-300 pl-5 py-3 mt-6 ${
//             showFilter ? '' : 'hidden'
//           } sm:block`}
//         >
//           <p className="mb-3 text-sm font-medium">CATEGORIES</p>

//           <div className="flex flex-col gap-2 text-sm font-light text-gray-700">

//             <label className="flex gap-2">
//               <input
//                 type="checkbox"
//                 className="w-3"
//                 value="Men"
//                 onChange={toggleCategory}
//               />
//               Men
//             </label>

//             <label className="flex gap-2">
//               <input
//                 type="checkbox"
//                 className="w-3"
//                 value="Women"
//                 onChange={toggleCategory}
//               />
//               Women
//             </label>

//             <label className="flex gap-2">
//               <input
//                 type="checkbox"
//                 className="w-3"
//                 value="Kids"
//                 onChange={toggleCategory}
//               />
//               Kids
//             </label>

//           </div>
//         </div>

//         {/* Type */}
//         <div
//           className={`border border-gray-300 pl-5 py-3 my-5 ${
//             showFilter ? '' : 'hidden'
//           } sm:block`}
//         >
//           <p className="mb-3 text-sm font-medium">TYPE</p>

//           <div className="flex flex-col gap-2 text-sm font-light text-gray-700">

//             <label className="flex gap-2">
//               <input
//                 type="checkbox"
//                 className="w-3"
//                 value="Topwear"
//                 onChange={toggleSubCategory}
//               />
//               Topwear
//             </label>

//             <label className="flex gap-2">
//               <input
//                 type="checkbox"
//                 className="w-3"
//                 value="Bottomwear"
//                 onChange={toggleSubCategory}
//               />
//               Bottomwear
//             </label>

//             <label className="flex gap-2">
//               <input
//                 type="checkbox"
//                 className="w-3"
//                 value="Winterwear"
//                 onChange={toggleSubCategory}
//               />
//               Winterwear
//             </label>

//           </div>
//         </div>

//       </div>

//       {/* Products */}
//       <div className="flex-1">

//         <div className="flex justify-between text-base sm:text-2xl mb-4">

//           <Title text1="ALL" text2="COLLECTIONS" />

//           <select
//             onChange={(e) => setSortType(e.target.value)}
//             className="border-2 border-gray-300 text-sm px-2"
//           >
//             <option value="relavent">Sort by: Relevant</option>
//             <option value="low-high">Sort by: Low to High</option>
//             <option value="high-low">Sort by: High to Low</option>
//           </select>

//         </div>

//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">

//           {filterProducts.map((item) => (
//             <ProductItem
//               key={item._id}
//               id={item._id}
//               image={item.image}
//               name={item.name}
//               price={item.price}
//             />
//           ))}

//         </div>

//       </div>

//     </div>
//   );
// };

// export default Collection;
import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";

const Collection = () => {
  const { products, search, showSearch } = useContext(ShopContext);

  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subcategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState("relavent");

  // Debounced search state
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [search]);

  const toggleCategory = (e) => {
    if (category.includes(e.target.value)) {
      setCategory((prev) =>
        prev.filter((item) => item !== e.target.value)
      );
    } else {
      setCategory((prev) => [...prev, e.target.value]);
    }
  };

  const toggleSubCategory = (e) => {
    if (subcategory.includes(e.target.value)) {
      setSubCategory((prev) =>
        prev.filter((item) => item !== e.target.value)
      );
    } else {
      setSubCategory((prev) => [...prev, e.target.value]);
    }
  };

  const applyFilter = () => {
    let productsCopy = [...products];

    // Search Filter (Debounced)
    if (showSearch && debouncedSearch) {
      productsCopy = productsCopy.filter((item) =>
        item.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Category Filter
    if (category.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        category.includes(item.category)
      );
    }

    // Sub Category Filter
    if (subcategory.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        subcategory.includes(item.subCategory)
      );
    }

    // Sorting
    switch (sortType) {
      case "low-high":
        productsCopy.sort((a, b) => a.price - b.price);
        break;

      case "high-low":
        productsCopy.sort((a, b) => b.price - a.price);
        break;

      default:
        break;
    }

    setFilterProducts(productsCopy);
  };

  useEffect(() => {
    applyFilter();
  }, [
    products,
    debouncedSearch,
    showSearch,
    category,
    subcategory,
    sortType,
  ]);

  return (
    <div className="flex flex-col sm:flex-row gap-1 sm:gap-10 pt-10 border-t">
      {/* Filters */}
      <div className="min-w-60">
        <p
          onClick={() => setShowFilter((prev) => !prev)}
          className="my-2 text-xl flex items-center cursor-pointer gap-2"
        >
          FILTERS
          <img
            className={`h-3 sm:hidden transition-transform duration-300 ${
              showFilter ? "rotate-90" : ""
            }`}
            src={assets.dropdown_icon}
            alt=""
          />
        </p>

        {/* Categories */}
        <div
          className={`border border-gray-300 pl-5 py-3 mt-6 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">CATEGORIES</p>

          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            <label className="flex gap-2">
              <input
                type="checkbox"
                className="w-3"
                value="Men"
                onChange={toggleCategory}
              />
              Men
            </label>

            <label className="flex gap-2">
              <input
                type="checkbox"
                className="w-3"
                value="Women"
                onChange={toggleCategory}
              />
              Women
            </label>

            <label className="flex gap-2">
              <input
                type="checkbox"
                className="w-3"
                value="Kids"
                onChange={toggleCategory}
              />
              Kids
            </label>
          </div>
        </div>

        {/* Type */}
        <div
          className={`border border-gray-300 pl-5 py-3 my-5 ${
            showFilter ? "" : "hidden"
          } sm:block`}
        >
          <p className="mb-3 text-sm font-medium">TYPE</p>

          <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
            <label className="flex gap-2">
              <input
                type="checkbox"
                className="w-3"
                value="Topwear"
                onChange={toggleSubCategory}
              />
              Topwear
            </label>

            <label className="flex gap-2">
              <input
                type="checkbox"
                className="w-3"
                value="Bottomwear"
                onChange={toggleSubCategory}
              />
              Bottomwear
            </label>

            <label className="flex gap-2">
              <input
                type="checkbox"
                className="w-3"
                value="Winterwear"
                onChange={toggleSubCategory}
              />
              Winterwear
            </label>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="flex-1">
        <div className="flex justify-between text-base sm:text-2xl mb-4">
          <Title text1="ALL" text2="COLLECTIONS" />

          <select
            onChange={(e) => setSortType(e.target.value)}
            className="border-2 border-gray-300 text-sm px-2"
          >
            <option value="relavent">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {filterProducts.map((item) => (
            <ProductItem
              key={item._id}
              id={item._id}
              image={item.image}
              name={item.name}
              price={item.price}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Collection;