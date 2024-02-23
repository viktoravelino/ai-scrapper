import React from 'react';
import './Button.scss';

const Button = () => {
    return (
        <button className='large-button'>
            Large<span className='ripple-effect'></span>
        </button>
    );
};

export default Button;
