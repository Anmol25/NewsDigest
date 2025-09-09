import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';

function SearchBar() {
    const navigate = useNavigate();
    const [ai, setAi] = useState<boolean>(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const searchQuery = searchInputRef.current?.value.trim();
        if (!searchQuery) {
            if (searchInputRef.current) {
                searchInputRef.current.value = '';
            }
            return;
        }
        navigate(`/search?query=${encodeURIComponent(searchQuery)}&ai=${ai}`);
    };

    return (
        <form className="flex flex-row items-center w-xl h-8 rounded-3xl shadow-md px-5 py-5.5 gap-2.5" onSubmit={handleSearch}>
            <input 
                type="text"
                name="search"
                placeholder="Search..."
                ref={searchInputRef}
                className="flex grow focus:outline-none focus:ring-0 autofill:bg-transparent autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
                />
            <button
                className={`px-4 py-0.5 rounded-3xl shadow-md transition duration-300 ease-in-out cursor-pointer ${
                    ai
                        ? 'border border-brandColor text-basePrimary hover:border-borderPrimary bg-brandColor'
                        : 'border border-borderPrimary text-borderPrimary hover:bg-brandColor hover:text-basePrimary hover:border-black bg-basePrimary'
                }`}
                onClick={() => setAi(!ai)}
                type="button">
                AI
            </button>
            <button className="text-2xl hover:cursor-pointer" type="submit">
                <i className="ri-search-line"></i>
            </button>
        </form>
        
    );
}

export default SearchBar;