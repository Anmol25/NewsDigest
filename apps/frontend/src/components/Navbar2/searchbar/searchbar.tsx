function SearchBar() {
    return (
        <div className="flex flex-row items-center w-xl h-8 rounded-3xl shadow-md px-5 py-5.5 gap-2.5">
            <input 
                type="text"
                name="search"
                placeholder="Search..."
                className="flex grow focus:outline-none focus:ring-0"
                />
            <button
                className="border border-borderPrimary text-borderPrimary bg-transparent font-bold px-4 py-0.5 
                rounded-3xl shadow-md hover:border-black hover:bg-black hover:text-white
                transition duration-300 ease-in-out">
                <p className="">AI</p>
            </button>
            <button className="text-2xl">
                <i className="ri-search-line"></i>
            </button>
        </div>
        
    );
}

export default SearchBar;