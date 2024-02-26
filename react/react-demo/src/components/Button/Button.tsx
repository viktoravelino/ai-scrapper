import React from 'react';
import './Button.scss';

const Button = () => {
    return (
        <button className='button' tabIndex={0} type='button'>Large<span className='ripple'></span></button>
    );
};

export default Button;